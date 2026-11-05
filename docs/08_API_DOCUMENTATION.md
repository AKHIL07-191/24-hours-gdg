# API Documentation (v1)

Base URL: `http://127.0.0.1:8000/api/v1`  
Interactive Swagger Docs: `http://127.0.0.1:8000/docs`

---

## 1. Authentication (`/auth`)

### `POST /auth/login`
Authenticates an emergency operator, administrator, responder, or analyst.
- **Request Body:**
  ```json
  {
    "email": "operator@resqnet.org",
    "password": "operator123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer",
    "user": {
      "id": 2,
      "email": "operator@resqnet.org",
      "full_name": "Ananya Sharma",
      "role": "OPERATOR"
    }
  }
  ```

### `GET /auth/me`
Retrieves current profile (Requires Bearer token).

---

## 2. Emergency Operations (`/emergencies`)

### `GET /emergencies`
Lists emergency requests with optional filters:
- Query parameters:
  - `status`: `NEW`, `VERIFIED`, `RESPONDER_ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `REJECTED`
  - `category`: `MEDICAL`, `FLOOD`, `FIRE`, `RESCUE`, `FOOD_WATER`, `OTHER`
  - `priority`: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`
  - `missing_location`: `true` | `false`
  - `search`: free-text search across IDs, phone numbers, landmarks, and summaries.

### `GET /emergencies/{id}`
Returns full emergency record including AI interpretation, location confidence, and associated deferred images.

### `PATCH /emergencies/{id}`
Updates details (coordinates, category, affected count, landmarks).

### `POST /emergencies/{id}/verify`
Human operator confirmation.
- **Request Body:**
  ```json
  {
    "status": "VERIFIED",
    "verification_notes": "Coordinates cross-checked with municipal flood gauge.",
    "priority": "CRITICAL",
    "send_sms_update": true
  }
  ```

### `POST /emergencies/{id}/assign-responder`
Dispatches a field team and queues SMS notification to the victim.
- **Request Body:**
  ```json
  {
    "responder_id": 1,
    "notes": "Deploying motorized rubber boat from north embankment.",
    "notify_victim_via_sms": true
  }
  ```

### `POST /emergencies/{id}/send-sms`
Sends a direct operator SMS update over cellular relay.
- **Request Body:**
  ```json
  {
    "message_text": "NDRF rescue boat is 300 meters away. Wave a bright cloth or whistle."
  }
  ```

---

## 3. SMS Gateway & Store-Forward (`/sms`)

### `POST /sms/inbound`
Direct submission from an Android SMS-forwarding app or simulator. The phone and backend must be able to reach each other over the local network.
- **Headers:** `X-Gateway-Key: resqnet-gateway-token-secret`
- **Content type:** `application/json` (form data is also accepted)
- **Request Body:**
  ```json
  {
    "message_id": "gw_1730001",
    "sender": "+919848011221",
    "text": "HELP|MED|17.7234,83.3012|2INJ|LOWBAT",
    "gateway_id": "ANDROID_GATEWAY_01"
  }
  ```
The `sender` and `text` fields are required. The endpoint rejects requests without a valid gateway key or without message content.

### `POST /sms/sync-batch`
Synchronizes an offline queue following a blackout.
- **Request Body:**
  ```json
  {
    "gateway_id": "ANDROID_GATEWAY_01",
    "messages": [
      {
        "message_id": "gw_1730002",
        "sender": "+919848022332",
        "text": "HELP|FLOOD|VIZAG|4 PEOPLE|1 ELDERLY",
        "timestamp": "2026-11-05T13:00:00Z"
      }
    ]
  }
  ```

### `GET /sms/outbox/pending`
Polled by Android Gateway to retrieve outgoing SMS to be transmitted over SIM.

### `POST /sms/outbox/{id}/status`
Gateway reports delivery status (`SENT`, `DELIVERED`, `FAILED`).

---

## 4. Multimedia Deferred Transmission (`/images`)

### `POST /images/upload`
Multipart upload. Accepts ground evidence, compresses image, and binds to incident ID.

### `GET /images/list`
Lists ground photos.

### `GET /images/{id}/file`
Serves compressed image file.

---

## 5. Analytics & Diagnostics (`/analytics`, `/system`)

### `GET /analytics/summary`
Returns KPI counts, category breakdown, priority distribution, and SMS traffic metrics.

### `GET /system/health`
Status of database, API version, and backend operational readiness.
