import json
import logging
import requests
from typing import Dict, Any, Optional, List
from backend.app.core.config import settings
from backend.app.services.parser_service import EmergencyParserService

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are RESQ-NET Disaster Emergency Intelligence Assistant.
Your duty is to parse incoming emergency SMS text messages received during catastrophic events (cyclones, floods, fires).
Translate regional Indian languages (Hindi, Telugu, Tamil, Bengali, etc.) to English.
Extract structured emergency details strictly as valid JSON with these keys:
{
  "category": "MEDICAL" | "FLOOD" | "FIRE" | "RESCUE" | "MISSING_PERSONS" | "FOOD_WATER" | "INFRASTRUCTURE" | "OTHER",
  "priority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "affected_count": integer (default 1),
  "medical_concerns": string or null,
  "location_name": string or null,
  "latitude": float or null,
  "longitude": float or null,
  "location_type": "GPS_EXACT" | "LANDMARK_APPROX" | "UNKNOWN",
  "is_location_missing": boolean,
  "ai_summary": "Concise 1-2 sentence operator briefing",
  "language_detected": "English" | "Telugu" | "Hindi" | "Tamil" | etc.,
  "translated_text": "English translation of the message",
  "confidence_score": float between 0.1 and 1.0
}

RULES:
1. Never hallucinate or invent GPS coordinates. If no numerical coordinates are in the text, latitude and longitude must be null.
2. If location cannot be determined, set is_location_missing: true.
3. If human life is in immediate peril (trapped, drowning, heavy injury, fire), priority must be CRITICAL.
4. Return ONLY the JSON object without markdown or code fencing.
"""

class GeminiEmergencyAI:
    @classmethod
    def analyze_emergency_sms(cls, text: str, sender_phone: str = "", active_emergencies: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """
        Analyzes an emergency SMS using Gemini API if key is configured,
        or uses deterministic rule-based fallback if offline/no key.
        """
        api_key = settings.GEMINI_API_KEY
        
        if not api_key or api_key == "YOUR_GEMINI_API_KEY":
            logger.info("Gemini API key not configured. Using rule-based offline parser.")
            return cls._run_offline_fallback(text, sender_phone, is_fallback=True)

        try:
            # Direct REST call to Gemini 2.0 Flash / Pro
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={api_key}"
            
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": f"{SYSTEM_PROMPT}\n\nIncoming SMS from {sender_phone}:\n\"{text}\""}
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.1,
                    "responseMimeType": "application/json"
                }
            }

            resp = requests.post(url, json=payload, timeout=12)
            if resp.status_code == 200:
                data = resp.json()
                raw_json = data["candidates"][0]["content"]["parts"][0]["text"]
                # Parse JSON
                parsed = json.loads(raw_json)
                
                # Check for possible duplicate against active emergencies
                duplicate_warning = cls._detect_duplicates(parsed, active_emergencies)
                if duplicate_warning:
                    parsed["ai_summary"] = f"[POTENTIAL DUPLICATE of {duplicate_warning}] {parsed.get('ai_summary', '')}"
                
                parsed["is_ai_fallback"] = False
                parsed["raw_message"] = text
                parsed["sender_phone"] = sender_phone
                return parsed
            else:
                logger.warning(f"Gemini API returned status {resp.status_code}: {resp.text}. Falling back to offline parser.")
                return cls._run_offline_fallback(text, sender_phone, is_fallback=True)
                
        except Exception as e:
            logger.error(f"Error calling Gemini API: {e}. Using deterministic fallback.")
            return cls._run_offline_fallback(text, sender_phone, is_fallback=True)

    @classmethod
    def _run_offline_fallback(cls, text: str, sender_phone: str, is_fallback: bool = True) -> Dict[str, Any]:
        parsed = EmergencyParserService.parse_sms(text, sender_phone)
        
        # Multilingual detection indicator
        detected_lang = "English"
        if any(ord(c) >= 0x0C00 and ord(c) <= 0x0C7F for c in text):
            detected_lang = "Telugu"
        elif any(ord(c) >= 0x0900 and ord(c) <= 0x097F for c in text):
            detected_lang = "Hindi"
        elif any(ord(c) >= 0x0B80 and ord(c) <= 0x0BFF for c in text):
            detected_lang = "Tamil"

        summary = f"{parsed['category']} emergency reported by {sender_phone or 'anonymous'}."
        if parsed.get("location_name"):
            summary += f" Location: {parsed['location_name']}."
        if parsed.get("affected_count"):
            summary += f" Approx {parsed['affected_count']} person(s) affected."
        if parsed.get("medical_concerns"):
            summary += f" Note: {parsed['medical_concerns']}."

        return {
            "category": parsed["category"],
            "priority": parsed["priority"],
            "affected_count": parsed["affected_count"],
            "medical_concerns": parsed["medical_concerns"],
            "location_name": parsed["location_name"],
            "latitude": parsed["latitude"],
            "longitude": parsed["longitude"],
            "location_type": parsed["location_type"],
            "location_confidence": parsed["location_confidence"],
            "is_location_missing": parsed["is_location_missing"],
            "ai_summary": summary,
            "language_detected": detected_lang,
            "translated_text": text,
            "confidence_score": 0.85 if parsed["message_format"] == "STRUCTURED" else 0.75,
            "is_ai_fallback": is_fallback,
            "raw_message": text,
            "sender_phone": sender_phone,
            "message_format": parsed["message_format"],
            "details": parsed.get("details")
        }

    @classmethod
    def _detect_duplicates(cls, new_request: Dict[str, Any], active_emergencies: Optional[List[Dict[str, Any]]]) -> Optional[str]:
        """Checks if a new request seems like a duplicate of an existing active request within the same area"""
        if not active_emergencies:
            return None

        new_cat = new_request.get("category")
        new_loc = (new_request.get("location_name") or "").lower()
        new_lat = new_request.get("latitude")
        new_lng = new_request.get("longitude")

        for item in active_emergencies:
            if item.get("status") in ["RESOLVED", "REJECTED"]:
                continue
            
            # Match category
            if item.get("category") == new_cat:
                # Coordinate distance check (< ~500m)
                item_lat = item.get("latitude")
                item_lng = item.get("longitude")
                if new_lat and new_lng and item_lat and item_lng:
                    diff_lat = abs(new_lat - item_lat)
                    diff_lng = abs(new_lng - item_lng)
                    if diff_lat < 0.005 and diff_lng < 0.005:
                        return item.get("id")

                # Name check
                item_loc = (item.get("location_name") or "").lower()
                if new_loc and item_loc and len(new_loc) > 3 and (new_loc in item_loc or item_loc in new_loc):
                    return item.get("id")

        return None
