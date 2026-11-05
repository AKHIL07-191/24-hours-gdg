# Android SMS Gateway Integration Specification

## 1. Overview
In disaster scenarios where mobile internet/data towers fail, SMS control channels often remain intact. An ordinary Android phone (Android 8.0+) with an active SIM card serves as a cellular relay node for RESQ-NET.

## 2. Hardware and Network Architecture
```
[Keypad Phones / Victims]
         |
         | Cellular SMS (2G/3G/4G Control Channel)
         v
[Android Gateway Phone + Local SIM]
         |
   +-----+--------------------------------------+
   | Local Persistent SQLite Queue (Store & Forward)
   +-----+--------------------------------------+
         |
         | Local Wi-Fi / Satellite Uplink / Intermittent 4G
         v
[RESQ-NET Central Coordination Backend]
```

## 3. Required Android Permissions
An SMS gateway app requires explicit Android permissions configured in `AndroidManifest.xml`:
- `android.permission.RECEIVE_SMS`: Triggers BroadcastReceiver when SMS arrives.
- `android.permission.READ_SMS`: Reads body, sender, and timestamp.
- `android.permission.SEND_SMS`: Sends automated acknowledgements and dispatcher messages.
- `android.permission.INTERNET`: Communicates with backend when data connection exists.
- `android.permission.ACCESS_NETWORK_STATE`: Monitors connection state changes.
- `android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`: Prevents Android Doze mode from sleeping the SMS listener during extended power outages.

## 4. Webhook and Sync Protocol
When an SMS is received:
1. Android `BroadcastReceiver` intercepts `Telephony.Sms.Intents.SMS_RECEIVED_ACTION`.
2. App writes message immediately to local SQLite database with `status = PENDING`.
3. If internet is reachable, calls `POST /api/v1/sms/inbound`.
4. If internet is down, an Android `WorkManager` job periodically retries with exponential backoff.
5. On connectivity restoration (`ConnectivityManager.CONNECTIVITY_ACTION`), triggers `POST /api/v1/sms/sync-batch`.
6. Outbound relay: App polls `GET /api/v1/sms/outbox/pending` every 10 seconds and transmits pending SMS via `SmsManager.getDefault().sendTextMessage(...)`.

## 5. Supported Open-Source / Production Apps
RESQ-NET is directly compatible with:
1. **SMS Gateway for Android** (Capcom6 / F-Droid) - sends webhooks to `/api/v1/sms/inbound`.
2. **Termux with Termux:API** (`termux-sms-list`, `termux-sms-send`).
3. **SMS Forwarder (F-Droid)** configured with Webhook URL.
4. **Built-in RESQ-NET Gateway Simulator** for hardware-free development and chaos testing.
