# Problem Statement

During catastrophic environmental disasters (e.g., coastal cyclones, urban flooding, seismic events):

1. **Mobile Internet Outages:** Power outages at base stations and severed optical ground cables sever 4G/5G data connections. Web-based emergency reporting systems, WhatsApp help lines, and mobile apps become inaccessible to victims.
2. **Voice Call Congestion:** Voice channels suffer severe queuing and capacity depletion. Emergency 112/911 circuits lock up due to thousands of simultaneous dialing attempts.
3. **Keypad Mobile Phone Vulnerability:** Millions of low-income or rural residents use feature phones lacking GPS sensors, internet browsers, or app stores. Most modern disaster platforms implicitly assume victims carry high-end smartphones with continuous broadband.
4. **Information Asymmetry and Delays:** Information from victims is fragmented, delayed, or expressed in diverse regional languages (e.g., Telugu, Hindi), creating bottlenecks for central dispatchers who must rapidly triage life-or-death situations.
5. **Gateway Network Instability:** Even when a relay device receives an emergency signal in a disaster perimeter, unstable backhaul links frequently drop transmissions, leading to lost emergency records and uncoordinated rescues.

### Core Challenge
How can an emergency response network ingest, translate, categorize, map, and acknowledge emergency distress calls from any mobile phone using purely cellular SMS, while guaranteeing zero message loss across intermittent gateway network outages?
