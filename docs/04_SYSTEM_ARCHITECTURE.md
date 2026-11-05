# System Architecture

## Architecture Diagram

```mermaid
flowchart TD
    subgraph VictimLayer["Victim Devices (Disaster Zone)"]
        V1["Basic Keypad Phone (SMS)"]
        V2["Android Smartphone (SMS + Deferred Photo)"]
    end

    subgraph GatewayLayer["Relay & Edge Layer (Peripheral Zone)"]
        GW["Android SMS Gateway Device (Local SIM)"]
        SQ[("Local SQLite Queue (Store & Forward)")]
        GW -->|Write on offline| SQ
        SQ -->|Batch sync on reconnect| GW
    end

    subgraph BackendLayer["Central Coordination Platform (FastAPI)"]
        API["FastAPI REST Endpoints"]
        SF["Store-and-Forward Sync Service"]
        EP["Emergency Parser & Geocoding"]
        AI["Gemini 2.0 AI Engine + Deterministic Fallback"]
        DB[("PostgreSQL / SQLite Database")]
        
        API --> SF
        SF --> EP
        EP --> AI
        AI --> DB
    end

    subgraph FrontendLayer["Tactical Operations Dashboard (React + Leaflet)"]
        D1["Operations Overview & Alert Stream"]
        D2["Live Tactical Map (OSM Leaflet)"]
        D3["Emergency Review & Operator Verification"]
        D4["NDRF/SDRF Responder Dispatcher"]
        D5["Gateway & Chaos Simulator Console"]
        D6["Analytics & Audit Trail"]
    end

    V1 -->|Cellular SMS Control Channel| GW
    V2 -->|Cellular SMS Control Channel| GW
    GW -->|HTTP / REST Webhook| API
    DB --> FrontendLayer
    FrontendLayer -->|Operator Action| API
    API -->|Outbound Ack / Dispatch SMS| GW
    GW -->|Cellular SMS Delivery| V1
    GW -->|Cellular SMS Delivery| V2
```

## Layer Specifications

### 1. Victim Communication Layer
- Ordinary 2G/3G/4G cellular SMS.
- No client-side software or internet configuration required for keypad phone users.
- Optional deferred smartphone image capture.

### 2. Android Gateway Layer
- Battery-backed Android handset with an active SIM card.
- Implements `BroadcastReceiver` on `SMS_RECEIVED`.
- Local persistent SQLite queue ensures 0-message-drop tolerance when internet fails.
- Batch synchronization endpoint flushes records upon network recovery.

### 3. Backend Coordination Layer
- **FastAPI:** High-throughput async REST framework.
- **SQLAlchemy ORM:** Portable between SQLite and PostgreSQL.
- **Pydantic v2:** Rigorous schema validation and sanitization.
- **RBAC Security:** Role-based access control protecting victim privacy.

### 4. AI Intelligence Layer
- **Google Gemini API:** Multilingual understanding, casualty extraction, priority recommendation, spatial duplicate clustering.
- **Rule-Based Engine:** Zero-dependency fallback guaranteed to function in completely air-gapped environments.

### 5. Frontend Command Center
- **React 18 + Vite + TypeScript:** High-performance single page application.
- **Tailwind CSS:** Modern tactical dark-mode operations interface.
- **Leaflet + OpenStreetMap:** Offline-friendly spatial visualization.
- **Recharts:** Live incident and resource utilization analytics.
