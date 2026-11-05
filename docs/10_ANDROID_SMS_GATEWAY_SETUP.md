# Android SMS Gateway Setup Guide

## 1. Hardware Architecture & Principle of Operation
Laptop and server hardware cannot directly receive cellular SMS without an attached cellular radio modem or a connected smartphone. RESQ-NET turns a consumer Android smartphone with an active SIM into a portable, battery-backed cellular SMS gateway node.

```
[Keypad Phone] ---> (Cellular SMS) ---> [Android Phone + SIM] ---> (Local Wi-Fi / Satlink) ---> [RESQ-NET Backend]
```

---

## 2. Option A: Hardware Android Phone Deployment

### Step 1: Connect the Phone and Laptop
1. Put the Android phone and laptop on the same trusted Wi-Fi network.
2. Keep an active SIM in the Android phone. Other phones send their SMS to this gateway phone number; the Android phone forwards newly received texts to the laptop.
3. On Windows, run `ipconfig` and find the laptop's Wi-Fi IPv4 address. Do not use `127.0.0.1` or `localhost` in the phone's webhook URL: those addresses refer to the phone itself.
4. Start the backend with `scripts\run_backend.bat` (it listens on the network interface). If Windows Firewall prompts, allow Python on **Private networks**.

### Step 2: Install and Configure a Forwarder
Install an Android SMS-forwarding app that supports an HTTP webhook, custom request headers, and retry/queue behavior. Grant the app SMS receive/read permissions and allow background activity/network use.

Configure its incoming-SMS action as follows:
- **Target URL:** `http://<LAPTOP_WIFI_IPV4>:8000/api/v1/sms/inbound`
- **HTTP Method:** `POST`
- **Header:** `X-Gateway-Key: <same value as GATEWAY_API_KEY in the backend .env>`
- **Content type:** `application/json`
- **JSON Payload Format:**
  ```json
  {
    "sender": "%from%",
    "text": "%body%",
    "message_id": "%id%",
    "gateway_id": "ANDROID_GATEWAY_01"
  }
  ```
Replace the placeholders with the forwarder's supported template variables and the laptop's actual Wi-Fi IPv4 address. Keep the gateway key private; the repository default is for local development only.

When another phone texts the Android SIM, the forwarder posts the sender and body to the backend. The backend creates an incident and an inbound SMS log; operators can review the text under **Communication History**. This forwards new incoming SMS only; it does not import the gateway phone's old messages.

---

## 3. Option B: Built-in Python Chaos Simulator (No Physical Phone Required)

For rapid development, automated tests, or evaluation without mobile SIM hardware:

### Running the Python Gateway Worker
```powershell
python -m gateway.python.gateway_service
```

### Running the Network Chaos Simulator
```powershell
python gateway/simulator/network_chaos_simulator.py
```
This demonstrates:
1. Online emergency SMS ingestion.
2. Severing gateway internet backhaul (messages queue locally in `gateway_chaos_test.db`).
3. Reconnecting internet and triggering an automated batch sync.
4. Idempotent duplicate suppression.
5. Two-way cellular acknowledgement dispatch.
