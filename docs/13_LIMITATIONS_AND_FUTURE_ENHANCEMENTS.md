# Limitations and Future Enhancements

## 1. Technical Limitations and Boundaries

1. **Cellular Radio Coverage Requirement:**  
   RESQ-NET cannot bypass a total cellular physical tower collapse. If all base transceiver stations (BTS) lose tower power and battery backups completely die with zero RF signal in the air, SMS cannot travel. The handset requires at least a 2G/3G signaling path to reach the gateway SIM.
2. **Cellular SMS Latency & Queuing:**  
   Under severe disaster congestion, telecom SMS centers (SMSC) may queue messages with minutes of delay. The system relies on message timestamps rather than gateway arrival time to order priorities accurately.
3. **Keypad Mobile Hardware Multimedia Constraints:**  
   Keypad mobile phones cannot capture or transmit deferred digital photographs. Ground evidence photos require a camera-enabled phone or relay through a field responder handset.
4. **Telecom Base Station Triangulation:**  
   Without an authorized direct carrier interface, cellular tower triangulation for keypad phones without GPS relies on victim-reported landmarks.

---

## 2. Future Enhancements

1. **LoRaWAN / Meshtastic P2P Radio Relay:**  
   Integrate 433/868/915 MHz LoRa mesh packet bridges for areas where even cellular towers are completely demolished.
2. **Direct SDR (Software Defined Radio) OpenBTS Ingestion:**  
   Deploy portable emergency backpack SDR cell towers capable of broadcasting an open GSM emergency network that keypad phones can camp onto directly.
3. **Automated Voice Synthesis IVR Callback:**  
   Synthesize automated voice calls in local languages for vision-impaired or illiterate victims who can answer calls but struggle with SMS.
4. **Satellite Direct-to-Cell (NTN 3GPP Rel 17):**  
   Interface with upcoming LEO satellite constellations (Starlink / AST SpaceMobile) capable of receiving standard SMS directly from ordinary unmodified phones.
