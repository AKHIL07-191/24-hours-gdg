# RESQ-NET: Project Abstract

**Project Title:** RESQ-NET: Disaster-Resilient Emergency Communication and Coordination System  
**Domain:** Disaster Management, Artificial Intelligence, Mobile Relays, Resilient Computing  

## Executive Abstract

Natural disasters such as cyclones, devastating floods, and earthquakes frequently incapacitate primary civilian communication infrastructures. Fiber backhauls sever, 4G/5G mobile packet data networks collapse under power loss or catastrophic congestion, and emergency web portals and voice call networks suffer complete saturation. In these dire scenarios, individuals stranded in affected zones—especially those utilizing basic keypad mobile devices—are rendered voiceless, incapable of signaling their location or medical status to emergency response organizations.

However, cellular Short Message Service (SMS) operates over signaling control channels (SS7 / 3GPP SMSC) rather than packet data streams. These control channels routinely survive severe network disruptions and packet drops when internet and voice traffic fail completely.

**RESQ-NET** is an end-to-end, disaster-resilient emergency coordination platform that leverages ordinary cellular SMS to bridge the communication gap. Operating without requiring victim smartphones to have mobile internet, RESQ-NET receives incoming emergency SMS messages through an Android phone with a local SIM acting as a cellular relay node. The gateway couples an asynchronous, persistent SQLite store-and-forward engine with the central FastAPI coordination server. If backhaul internet at the gateway is disrupted, messages are cached locally with unique IDs and automatically batch-synchronized with zero loss upon connectivity restoration.

At the central hub, Google Gemini AI—augmented by a rule-based deterministic fallback engine—interprets natural-language and structured messages across regional Indian languages (Hindi, Telugu, Tamil, Bengali). It extracts structured categories, victim headcounts, chronic/mobility medical vulnerabilities, detects potential duplicate reports, and flags missing location data. Verified coordinates and landmarks are rendered onto an interactive Leaflet OpenStreetMap emergency dashboard. Verified human operators retain final authority over rescue dispatch, while automated two-way SMS messages deliver immediate acknowledgements and dispatcher alerts back to victims over cellular networks. Deferred smartphone photographs are compressed and correlated with request IDs once internet returns, providing a comprehensive, resilient lifecycle for humanitarian disaster response.
