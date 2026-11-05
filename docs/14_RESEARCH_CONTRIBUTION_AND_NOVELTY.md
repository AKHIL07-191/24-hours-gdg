# Research Contribution and Novelty Assessment

## 1. Academic & Practical Contributions

1. **Cellular Control-Channel Exploitation for Disaster Resilience:**  
   Most contemporary disaster platforms (Ushahidi, Sahana Eden, crisis mapping apps) rely fundamentally on IP-based mobile data (TCP/IP over 4G/5G). RESQ-NET operationalizes the insight that SS7/3GPP SMS control channels operate at vastly lower signal-to-noise thresholds than data packets and endure during infrastructure brownouts.

2. **Idempotent Edge-to-Core Store-and-Forward Protocol:**  
   Standard webhook architectures fail catastrophically when gateway uplinks flap intermittently. RESQ-NET's local SQLite persistence paired with client-generated message hashing ensures zero drop rates and zero duplicated emergency tickets.

3. **Multilingual Regional Indian Language Triage in Low-Bandwidth Formats:**  
   Demonstrates LLM (Gemini 2.0) semantic interpretation coupled with deterministic regex fallbacks on SMS payloads under 160 characters, translating vernacular emergency cries (Telugu, Hindi) into standardized spatial incident tickets.

4. **Human-in-the-Loop Safe AI Protocol:**  
   Establishes clear boundaries ensuring AI models assist with classification, casualty extraction, and spatial deduplication, while never possessing unilateral authority to dispatch field rescue personnel.
