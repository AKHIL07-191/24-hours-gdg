# RESQ-NET: Disaster-Resilient Emergency Communication and Coordination System

[![Status](https://img.shields.io/badge/Status-Operational-emerald)](https://github.com)
[![Python](https://img.shields.io/badge/Python-3.12-blue)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61dafb)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff)](https://vitejs.dev)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-green)](https://leafletjs.com)
[![License](https://img.shields.io/badge/License-MIT-amber)](LICENSE)

RESQ-NET is an AI-assisted, disaster-resilient emergency coordination platform that enables individuals in catastrophe zones (cyclones, floods, structural collapses) to send emergency distress requests using ordinary **cellular SMS** when mobile internet (4G/5G) and voice telephone channels fail.

---

## ⚡ Quick Start: Run the Complete System Locally

### Prerequisites
- Python 3.10+ (Installed & tested on Python 3.12)
- Node.js 18+ (Local portable Node v20 LTS included in `.tools/nodejs`)

### 1. Start the Backend API (FastAPI)
In a terminal:
```powershell
scripts\run_backend.bat
```
- API Endpoint: `http://127.0.0.1:8000`
- Interactive Swagger Documentation: `http://127.0.0.1:8000/docs`
- The database (`resqnet.db`) and realistic initial disaster records and NDRF responder teams are seeded automatically on first launch.

### 2. Start the Frontend Operations Dashboard (React + Vite)
In a second terminal:
```powershell
scripts\run_frontend.bat
```
- Open `http://localhost:5173` in your browser.
- Log in with any of the pre-seeded role accounts:
  - **Emergency Operator:** `operator@resqnet.org` / `operator123`
  - **Chief Administrator:** `admin@resqnet.org` / `admin123`
  - **Field Responder:** `responder@resqnet.org` / `responder123`
  - **Research Analyst:** `analyst@resqnet.org` / `analyst123`

### 3. Run the Disaster Resilience Chaos Simulator
In a third terminal:
```powershell
scripts\run_chaos_simulator.bat
```
Or use the interactive **SMS Gateway & Sync** page directly inside the web dashboard to simulate cellular outages, inject emergency SMS, and watch the store-and-forward batch recovery in real time!

---

## 🚀 Key Features & Capabilities

1. **Ordinary Phone Compatibility:** Works from basic keypad feature phones (Nokia, Samsung, JioPhone) without internet or apps.
2. **Android Phone Cellular Gateway:** A low-cost Android handset with a local SIM serves as the disaster perimeter SMS relay node.
3. **Local Store-and-Forward Engine:** Incorporates persistent SQLite queue storage at the gateway. If internet to the central server fails, messages queue safely and batch-sync with zero loss upon reconnection.
4. **Idempotent Deduplication:** Unique client-generated IDs prevent duplicated cellular retries from creating duplicate incident tickets.
5. **AI Emergency Intelligence:** Uses Google Gemini API (with deterministic regex fallback) to extract categories, casualties, medical risks, detect spatial duplicates, and translate regional languages (Telugu, Hindi).
6. **Tactical GIS Mapping:** OpenStreetMap Leaflet interface displays live incident pins with confidence radiuses, responder positions, and a missing-location triage drawer.
7. **Two-Way Closed-Loop SMS:** Automatically emits SMS acknowledgements, missing-location prompts, and dispatcher notices back to victims over cellular networks.
8. **Deferred Multimedia Evidence:** Compresses high-resolution ground photos and uploads them once internet is restored, linking them directly to the original SMS incident ID.
9. **Role-Based Access Control:** Privacy masking ensures read-only analysts only see redacted phone numbers (`+91 98480*****`).

---

## 📁 Repository Structure

```
resq-net/
├── backend/                  # FastAPI Backend Layer
│   ├── app/
│   │   ├── api/v1/          # REST Endpoints (Auth, Emergencies, SMS, Responders, Images, Analytics)
│   │   ├── models/          # SQLAlchemy Database Models
│   │   ├── schemas/         # Pydantic v2 Request/Response Schemas
│   │   ├── services/        # Store-and-Forward, Parser, Emergency & Location Logic
│   │   ├── ai/              # Gemini AI Integration & Deterministic Fallback Engine
│   │   ├── communication/   # Outbound SMS Templates & Formatting
│   │   ├── database/        # Database Session & Seeder
│   │   └── security/        # JWT Authentication, RBAC, & Phone Masking
│   └── tests/               # Automated Pytest Suite (11/11 Passing)
├── frontend/                 # React 18 + Vite + TypeScript Command Dashboard
│   ├── src/
│   │   ├── components/      # Navbar, Sidebar, Emergency Badges
│   │   ├── views/           # 10 Operations Pages (Overview, Map, Requests, Responders, etc.)
│   │   ├── context/         # Auth Context & RBAC State
│   │   └── services/        # Axios/Fetch API Services
├── gateway/                  # Cellular SMS Gateway Layer
│   ├── android/             # Android APK Webhook Specs & Setup Documentation
│   ├── python/              # Python Gateway Service & Persistent SQLite Local Queue
│   └── simulator/           # Network Chaos Simulator (Blackouts, Retries, Sync)
├── docs/                     # 14 Comprehensive Technical & Architectural Documents
├── scripts/                  # One-Click Execution Batch Scripts & Database Seeders
├── docker-compose.yml        # Production Docker Deployment
├── Dockerfile.backend        # Backend Containerfile
├── .env.example              # Environment Configuration Template
├── DEVELOPMENT_STATUS.md     # Feature Verification & Tracking Matrix
└── README.md
```

---

## 🧪 Testing

Run backend tests:
```powershell
python -m pytest backend/tests -v
```

Compile and type-check frontend:
```powershell
cd frontend
npm run build
```

---

## 📜 Documentation

Full architectural, database, API, and setup documentation is located in the [`docs/`](docs/) directory:
1. [Project Abstract](docs/01_PROJECT_ABSTRACT.md)
2. [Problem Statement](docs/02_PROBLEM_STATEMENT.md)
3. [Proposed Solution](docs/03_PROPOSED_SOLUTION.md)
4. [System Architecture (with Mermaid Diagrams)](docs/04_SYSTEM_ARCHITECTURE.md)
5. [Data Flow Diagrams](docs/05_DATA_FLOW_DIAGRAM.md)
6. [Use Case Diagrams](docs/06_USE_CASE_DIAGRAM.md)
7. [Database ER Diagrams](docs/07_DATABASE_ER_DIAGRAM.md)
8. [REST API Documentation](docs/08_API_DOCUMENTATION.md)
9. [Installation & Configuration Guide](docs/09_INSTALLATION_AND_CONFIG_GUIDE.md)
10. [Android SMS Gateway Setup Guide](docs/10_ANDROID_SMS_GATEWAY_SETUP.md)
11. [Gemini AI Integration Guide](docs/11_GEMINI_AI_INTEGRATION_GUIDE.md)
12. [Testing & Verification Report](docs/12_TESTING_AND_VERIFICATION.md)
13. [Limitations & Future Work](docs/13_LIMITATIONS_AND_FUTURE_ENHANCEMENTS.md)
14. [Research Contribution & Novelty](docs/14_RESEARCH_CONTRIBUTION_AND_NOVELTY.md)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
