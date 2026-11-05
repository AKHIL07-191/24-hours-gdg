# Proposed Solution: RESQ-NET Architecture

RESQ-NET addresses the communication failure through a hybrid edge-and-cloud architecture:

1. **Ubiquitous SMS Ingestion:** Accepts emergency text in both standardized formats (e.g., `HELP|MED|17.7234,83.3012|2INJ|LOWBAT`) and unstructured natural language messages in regional Indian languages.
2. **Android Phone Cellular Gateway:** Uses consumer Android devices equipped with active local SIM cards to serve as low-cost, portable cellular relay nodes deployed in disaster perimeters.
3. **Local Store-and-Forward Engine:** Incorporates a local SQLite persistence layer on the gateway device. If internet backhaul drops, inbound and outbound messages queue safely with exponential backoff retry logic, eliminating single-point-of-failure packet loss.
4. **Idempotent Synchronization:** Uses client-generated GUIDs and fingerprint matching to guarantee that duplicated cellular re-transmissions never generate duplicate emergency tickets in the database.
5. **AI Emergency Intelligence Layer:** Gemini 2.0 Flash extracts structured categories (Medical, Flood, Fire, Rescue, Missing Persons, Supplies), detects casualties and elderly/infant vulnerabilities, standardizes regional dialects, detects spatial duplicates, and alerts operators to missing coordinates. A rule-based regex fallback ensures continuity if external AI APIs become unavailable.
6. **Location Intelligence:** Distinguishes verified GPS fixes from approximate landmark geocoding and network estimates, indicating spatial confidence on OpenStreetMap without ever fabricating coordinates.
7. **Two-Way Closed-Loop SMS:** Automatically emits immediate cellular acknowledgements, prompts victims for missing landmarks, and dispatches verified team assignment notices once confirmed by human operators.
8. **Deferred Multimedia Evidence:** Compresses high-resolution field photos on client devices, caching them until uplink connectivity returns, then binding them to the original SMS incident ID.
