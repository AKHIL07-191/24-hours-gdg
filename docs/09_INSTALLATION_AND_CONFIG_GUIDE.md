# Installation and Configuration Guide

## System Requirements
- **OS:** Windows 10/11, Linux (Ubuntu 20.04+), or macOS
- **Python:** 3.10+ (Tested on Python 3.12)
- **Node.js:** 18+ or 20+ LTS
- **Database:** SQLite (default zero-configuration) or PostgreSQL 14+

---

## 1. Local Development Setup (Windows / Linux)

### Step 1: Clone and Inspect Workspace
```powershell
git clone <repo-url>
cd "24 hours gdg"
```

### Step 2: Configure Environment
Copy `.env.example` to `.env`:
```powershell
cp .env.example .env
```
Key configuration items:
- `SECRET_KEY`: Random 256-bit string for JWT token generation.
- `GATEWAY_API_KEY`: Secret shared with Android Gateway or Python worker.
- `GEMINI_API_KEY`: Google AI Studio API key (leave empty to use deterministic fallback).

### Step 3: Install Backend Dependencies & Run
```powershell
pip install -r requirements.txt
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend initializes the SQLite database (`resqnet.db`) and seeds initial users and NDRF teams automatically on startup.
- Swagger API Docs: `http://127.0.0.1:8000/docs`

To receive SMS forwarded from an Android phone on the same Wi-Fi, bind to the laptop's network interface instead:
```powershell
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
Use the laptop's Wi-Fi IPv4 address from `ipconfig` in the Android webhook URL (`http://<LAPTOP_WIFI_IPV4>:8000/api/v1/sms/inbound`) and allow port 8000 through Windows Firewall on private networks.

### Step 4: Run React Frontend
```powershell
cd frontend
npm install
npm run dev
```
Dashboard available at: `http://localhost:5173`

---

## 2. Docker Compose Deployment (Production)

Deploy with a single command:
```bash
docker-compose up --build -d
```
- Dashboard: `http://localhost:3000`
- API Backend: `http://localhost:8000`
- SQLite database persisted in `./data` volume.

---

## 3. Pre-Seeded Default Operator Accounts

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Emergency Operator** | `operator@resqnet.org` | `operator123` | Verify, Reject, Assign Responders, Send SMS |
| **Chief Administrator** | `admin@resqnet.org` | `admin123` | Full access, Register Users, System Seed |
| **Field Responder** | `responder@resqnet.org` | `responder123` | View assigned requests, update team status |
| **Research Analyst** | `analyst@resqnet.org` | `analyst123` | Read-only analytics with **masked phone numbers** |
