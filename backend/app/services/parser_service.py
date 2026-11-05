import re
from typing import Dict, Any, Optional, Tuple

class EmergencyParserService:
    """
    Parses emergency SMS messages into structured data.
    Supports both pipe/symbol structured format and natural-language extraction.
    """

    CATEGORY_KEYWORDS = {
        "MEDICAL": ["med", "medical", "doctor", "ambulance", "inj", "injury", "bleeding", "heart", "breath", "oxygen", "stroke", "diabetic", "दवा", "इलाज", "వైద్యం", "గాయం"],
        "FLOOD": ["flood", "water", "submerged", "drowning", "river", "overflow", "current", "cyclone", "बाढ़", "पानी", "వరద", "ముంపు"],
        "FIRE": ["fire", "smoke", "burn", "explosion", "blaze", "flames", "आग", "धुआं", "మంటలు", "అగ్ని"],
        "RESCUE": ["trapped", "stuck", "roof", "rescue", "collapse", "debris", "marooned", "फंसे", "बचाव", "చిక్కుకున్నారు", "రక్షించండి"],
        "MISSING_PERSONS": ["missing", "lost", "separated", "child missing", "not found", "लापता", "खोया", "కనిపించట్లేదు"],
        "FOOD_WATER": ["food", "ration", "drinking water", "hungry", "starving", "no food", "खाना", "राशन", "ఆహారం", "మంచినీరు"],
        "INFRASTRUCTURE": ["bridge", "road blocked", "power out", "electric wire", "landslide", "pole fell", "सड़क बंद", "రోడ్డు"],
    }

    # Common disaster landmarks and major Indian cities
    KNOWN_LANDMARKS = {
        "VIZAG": (17.6868, 83.2185),
        "VISAKHAPATNAM": (17.6868, 83.2185),
        "RK BEACH": (17.7144, 83.3236),
        "BUS STAND": (17.7234, 83.3012),
        "RTC BUS STAND": (17.7234, 83.3012),
        "RAILWAY STATION": (17.7214, 83.2906),
        "GAJUWAKA": (17.6908, 83.1654),
        "MADHURAWADA": (17.8016, 83.3512),
        "SIMHACHALAM": (17.7665, 83.2505),
        "ANAKAPALLE": (17.6913, 83.0039),
        "BEACH ROAD": (17.7150, 83.3240),
        "KGH HOSPITAL": (17.7058, 83.3050),
        "MVP COLONY": (17.7420, 83.3320),
        "SEETHAMMADHARA": (17.7370, 83.3090),
        "DWARAKA NAGAR": (17.7270, 83.3070),
        "RUSHIKONDA": (17.7816, 83.3854),
        "HYDERABAD": (17.3850, 78.4867),
        "SECUNDERABAD": (17.4399, 78.4983),
        "VIJAYAWADA": (16.5062, 80.6480),
        "GUNTUR": (16.3067, 80.4365),
        "TIRUPATI": (13.6288, 79.4192),
        "NELLORE": (14.4426, 79.9865),
        "RAJAHMUNDRY": (17.0005, 81.8040),
        "KAKINADA": (16.9891, 82.2475),
        "BHIMAVARAM": (16.5449, 81.5212),
        "BENGALURU": (12.9716, 77.5946),
        "BANGALORE": (12.9716, 77.5946),
        "CHENNAI": (13.0827, 80.2707),
        "MUMBAI": (19.0760, 72.8777),
        "DELHI": (28.6139, 77.2090),
        "KOLKATA": (22.5726, 88.3639),
    }

    @classmethod
    def parse_sms(cls, text: str, sender_phone: str = "") -> Dict[str, Any]:
        text_clean = text.strip()
        
        # Check if structured (contains delimiters like '|' or multiple colons/semicolons)
        if "|" in text_clean:
            return cls._parse_structured(text_clean, sender_phone)
        else:
            return cls._parse_natural_language(text_clean, sender_phone)

    @classmethod
    def _parse_structured(cls, text: str, sender_phone: str) -> Dict[str, Any]:
        parts = [p.strip() for p in text.split("|") if p.strip()]
        
        category = "OTHER"
        lat, lng = None, None
        loc_name = None
        loc_type = "UNKNOWN"
        loc_confidence = 0.0
        affected_count = 1
        medical_concerns = None
        details = []
        priority = "MEDIUM"

        for part in parts:
            part_upper = part.upper()
            
            # Skip header prefix like HELP
            if part_upper in ["HELP", "EMERGENCY", "SOS", "RESQ"]:
                continue
            
            # Check Category
            found_cat = cls._match_category(part_upper)
            if found_cat:
                if category == "OTHER" or (category == "RESCUE" and found_cat in ["FIRE", "MEDICAL", "FLOOD"]):
                    category = found_cat
                continue

            # Check Coordinates (e.g. 17.7234,83.3012)
            coords = cls._extract_coordinates(part)
            if coords:
                lat, lng = coords
                loc_type = "GPS_EXACT"
                loc_confidence = 0.98
                loc_name = f"GPS ({lat:.4f}, {lng:.4f})"
                continue

            # Check People count / Injured (e.g. 2INJ, 4 PEOPLE, 5 PERSONS, 1 ELDERLY)
            people_match = re.search(r"(\d+)\s*(PEOPLE|PERSONS|MEMBERS|INJ|INJURED|TRAPPED|ELDERLY|KIDS|CHILDREN)?", part_upper)
            if people_match:
                count_val = int(people_match.group(1))
                affected_count = max(affected_count, count_val)
                if "INJ" in part_upper:
                    medical_concerns = f"{count_val} Injured"
                    priority = "CRITICAL"
                elif "ELDERLY" in part_upper:
                    medical_concerns = "Elderly person needing evacuation"
                    if priority != "CRITICAL":
                        priority = "HIGH"

            # Check Known Landmark / City
            if not lat:
                for lm_name, (lm_lat, lm_lng) in cls.KNOWN_LANDMARKS.items():
                    if lm_name in part_upper:
                        loc_name = lm_name.title()
                        lat, lng = lm_lat, lm_lng
                        loc_type = "LANDMARK_APPROX"
                        loc_confidence = 0.65
                        break

            # If not assigned yet and looks like text location
            if not loc_name and any(loc_indicator in part_upper for loc_indicator in ["NEAR", "OPP", "ROAD", "STREET", "NAGAR", "COLONY", "VILLAGE"]):
                loc_name = part
                loc_type = "LANDMARK_APPROX"
                loc_confidence = 0.45
            else:
                details.append(part)

        # Priority calculation based on category & details
        if category in ["FIRE", "RESCUE"] or "TRAPPED" in text.upper():
            priority = "CRITICAL"
        elif category in ["MEDICAL", "FLOOD"]:
            if priority != "CRITICAL":
                priority = "HIGH"

        is_missing_loc = (lat is None and not loc_name)

        return {
            "message_format": "STRUCTURED",
            "category": category,
            "priority": priority,
            "affected_count": affected_count,
            "medical_concerns": medical_concerns,
            "details": " | ".join(details) if details else None,
            "location_name": loc_name,
            "latitude": lat,
            "longitude": lng,
            "location_type": loc_type,
            "location_confidence": loc_confidence,
            "is_location_missing": is_missing_loc,
            "sender_phone": sender_phone,
            "raw_message": text
        }

    @classmethod
    def _parse_natural_language(cls, text: str, sender_phone: str) -> Dict[str, Any]:
        text_upper = text.upper()
        
        # 1. Category extraction
        category = "OTHER"
        for cat, keywords in cls.CATEGORY_KEYWORDS.items():
            if any(kw in text.lower() for kw in keywords):
                category = cat
                break
        
        # 2. Coordinates extraction
        coords = cls._extract_coordinates(text)
        lat, lng = None, None
        loc_name = None
        loc_type = "UNKNOWN"
        loc_confidence = 0.0

        if coords:
            lat, lng = coords
            loc_type = "GPS_EXACT"
            loc_confidence = 0.95
            loc_name = f"GPS ({lat:.4f}, {lng:.4f})"
        else:
            # Check landmark
            for lm_name, (lm_lat, lm_lng) in cls.KNOWN_LANDMARKS.items():
                if lm_name in text_upper:
                    loc_name = lm_name.title()
                    lat, lng = lm_lat, lm_lng
                    loc_type = "LANDMARK_APPROX"
                    loc_confidence = 0.65
                    break
            
            # If no landmark match, extract 'near ...' or 'at ...'
            if not loc_name:
                loc_match = re.search(r"(?:near|at|in|opp|opposite|beside)\s+([A-Za-z0-9\s,\.-]{3,35})", text, re.IGNORECASE)
                if loc_match:
                    loc_name = loc_match.group(1).strip()
                    loc_type = "LANDMARK_APPROX"
                    loc_confidence = 0.40

        # 3. People count
        affected_count = 1
        count_match = re.search(r"(\d+)\s*(?:family\s+members|family|people|persons|members|individuals|men|women|kids|children|folks)", text, re.IGNORECASE)
        if count_match:
            affected_count = int(count_match.group(1))

        # 4. Medical / Vulnerability concerns
        concerns = []
        if re.search(r"(injur|bleeding|fracture|wound|cut|broken)", text, re.IGNORECASE):
            concerns.append("Physical injury")
        if re.search(r"(elderly|old person|grand|senior citizen)", text, re.IGNORECASE):
            concerns.append("Elderly person")
        if re.search(r"(pregnant|labor|baby|infant)", text, re.IGNORECASE):
            concerns.append("Pregnant mother / infant")
        if re.search(r"(wheelchair|disabled|handicap|paralyzed)", text, re.IGNORECASE):
            concerns.append("Mobility impaired")
        if re.search(r"(diabet|heart|oxygen|bp|asthma)", text, re.IGNORECASE):
            concerns.append("Chronic health risk")

        medical_concerns = ", ".join(concerns) if concerns else None

        # 5. Priority determination
        priority = "MEDIUM"
        if "trapped" in text.lower() or "drowning" in text.lower() or "fire" in text.lower() or "critical" in text.lower() or (medical_concerns and "injury" in medical_concerns.lower()):
            priority = "CRITICAL"
        elif category in ["MEDICAL", "FLOOD", "RESCUE"] or affected_count > 3:
            priority = "HIGH"

        is_missing_loc = (lat is None and not loc_name)

        return {
            "message_format": "NATURAL_LANGUAGE",
            "category": category,
            "priority": priority,
            "affected_count": affected_count,
            "medical_concerns": medical_concerns,
            "details": text,
            "location_name": loc_name,
            "latitude": lat,
            "longitude": lng,
            "location_type": loc_type,
            "location_confidence": loc_confidence,
            "is_location_missing": is_missing_loc,
            "sender_phone": sender_phone,
            "raw_message": text
        }

    @classmethod
    def _extract_coordinates(cls, text: str) -> Optional[Tuple[float, float]]:
        # Match pattern like: 17.7234, 83.3012 or 17.7234,83.3012
        coord_pattern = r"(-?\d{1,2}\.\d{3,7})\s*,\s*(-?\d{1,3}\.\d{3,7})"
        match = re.search(coord_pattern, text)
        if match:
            lat = float(match.group(1))
            lng = float(match.group(2))
            # Validate lat/lng range
            if -90.0 <= lat <= 90.0 and -180.0 <= lng <= 180.0:
                return lat, lng
        return None

    @classmethod
    def _match_category(cls, word: str) -> Optional[str]:
        if word in ["MED", "MEDICAL", "DOCTOR", "AMBULANCE"]:
            return "MEDICAL"
        if word in ["FLOOD", "WATER", "SUBMERGED", "CYCLONE"]:
            return "FLOOD"
        if word in ["FIRE", "SMOKE", "BLAZE"]:
            return "FIRE"
        if word in ["RESCUE", "TRAPPED", "STUCK", "COLLAPSE"]:
            return "RESCUE"
        if word in ["MISSING", "LOST"]:
            return "MISSING_PERSONS"
        if word in ["FOOD", "WATER_SUPPLY", "RATION"]:
            return "FOOD_WATER"
        if word in ["INFRA", "ROAD", "BRIDGE"]:
            return "INFRASTRUCTURE"
        return None
