# Gemini AI Emergency Intelligence Integration

## 1. Role of AI in RESQ-NET
In life-or-death scenarios, dispatchers face high cognitive overload. Google Gemini AI acts as an **assistive triage co-pilot**, not an autonomous decision maker.

### Core Capabilities:
1. **Multilingual Regional Standardization:** Automatically recognizes and translates regional Indian languages (Hindi, Telugu, Tamil, Bengali, Marathi) into clear English briefings.
2. **Entity & Casualty Extraction:** Extracts exact numbers of stranded individuals, injuries, and medical/mobility vulnerabilities (e.g. insulin-dependent diabetics, oxygen needs, pregnant mothers, infants, wheelchair users).
3. **Structured Classification:** Groups incidents into discrete categories: `MEDICAL`, `FLOOD`, `FIRE`, `RESCUE`, `MISSING_PERSONS`, `FOOD_WATER`, `INFRASTRUCTURE`.
4. **Spatial Duplicate Detection:** Clusters incoming SMS reports geographically and flags reports that describe the same incident within 500 meters to prevent duplicate rescue team deployments.
5. **Missing Information Flags:** Explicitly identifies messages missing location references, prompting automated follow-up SMS questions.

---

## 2. Safety Guardrails & Principles
- **No Autonomous Dispatch:** AI recommendations never trigger field rescues independently. Human verification by an authorized operator is strictly mandatory.
- **No Coordinate Hallucination:** The system strictly prohibits hallucinating GPS fixes. If numerical coordinates or known landmarks are absent, latitude/longitude remains `null` and `is_location_missing` is set to `true`.
- **Deterministic Offline Fallback:** If the Gemini API key is missing or internet uplink is down, the system seamlessly transitions to `EmergencyParserService` (rule-based regex parser) with zero downtime or runtime exceptions.

---

## 3. Configuration
Set your Gemini API Key in `.env`:
```env
GEMINI_API_KEY="your-gemini-api-key-here"
GEMINI_MODEL="gemini-2.0-flash"
```
If `GEMINI_API_KEY` is empty, the platform automatically runs in deterministic fallback mode with full multilingual keyword extraction.
