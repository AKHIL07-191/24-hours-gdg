import uuid

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.config import settings

client = TestClient(app)

def test_full_inbound_sms_to_outbound_ack_flow():
    headers = {"X-Gateway-Key": settings.GATEWAY_API_KEY}
    message_id = f"test_e2e_msg_{uuid.uuid4().hex}"
    
    # 1. Ingest structured SMS
    payload = {
        "message_id": message_id,
        "sender": "+919848099888",
        "text": "HELP|MED|17.7234,83.3012|2INJ|LOWBAT",
        "gateway_id": "ANDROID_GATEWAY_01"
    }
    res = client.post("/api/v1/sms/inbound", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "PROCESSED"
    req_id = data["request_id"]

    # 2. Re-ingesting same message_id should be suppressed as duplicate
    res_dup = client.post("/api/v1/sms/inbound", json=payload, headers=headers)
    assert res_dup.status_code == 200
    assert res_dup.json()["status"] == "DUPLICATE_SUPPRESSED"

    # 3. Poll outbox for pending automated cellular SMS
    outbox_res = client.get("/api/v1/sms/outbox/pending?gateway_id=ANDROID_GATEWAY_01", headers=headers)
    assert outbox_res.status_code == 200
    pending_sms = outbox_res.json()["pending_sms"]
    
    matching_ack = next((s for s in pending_sms if s["emergency_request_id"] == req_id), None)
    assert matching_ack is not None
    assert "received" in matching_ack["message_text"].lower()

    # 4. Report delivery status back
    status_res = client.post(
        f"/api/v1/sms/outbox/{matching_ack['id']}/status",
        json={"status": "DELIVERED"},
        headers=headers
    )
    assert status_res.status_code == 200
    assert status_res.json()["current_status"] == "DELIVERED"

def test_batch_sync_store_and_forward():
    headers = {"X-Gateway-Key": settings.GATEWAY_API_KEY}
    batch_id = uuid.uuid4().hex
    batch_payload = {
        "gateway_id": "ANDROID_GATEWAY_01",
        "messages": [
            {
                "message_id": f"batch_msg_01_{batch_id}",
                "sender": "+919848011111",
                "text": "HELP|FLOOD|VIZAG|3 PEOPLE|1 ELDERLY"
            },
            {
                "message_id": f"batch_msg_02_{batch_id}",
                "sender": "+919848022222",
                "text": "వరద నీరు ఇంట్లోకి వచ్చింది రక్షించండి"
            }
        ]
    }

    res = client.post("/api/v1/sms/sync-batch", json=batch_payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["batch_total"] == 2
    assert data["processed_count"] == 2

def test_inbound_sms_requires_gateway_key():
    payload = {
        "message_id": "unauthorized_gateway_message",
        "sender": "+919848033333",
        "text": "Please help"
    }

    res = client.post("/api/v1/sms/inbound", json=payload)

    assert res.status_code == 401

def test_forwarder_can_post_form_encoded_sms():
    headers = {"X-Gateway-Key": settings.GATEWAY_API_KEY}
    payload = {
        "id": f"phone_forwarder_form_{uuid.uuid4().hex}",
        "from": "+919848044444",
        "body": "Please send help to the community center"
    }

    res = client.post("/api/v1/sms/inbound", data=payload, headers=headers)

    assert res.status_code == 200
    assert res.json()["status"] == "PROCESSED"

def test_inbound_sms_rejects_missing_message_text():
    headers = {"X-Gateway-Key": settings.GATEWAY_API_KEY}
    payload = {"message_id": "missing_sms_body", "sender": "+919848055555"}

    res = client.post("/api/v1/sms/inbound", json=payload, headers=headers)

    assert res.status_code == 422
    assert res.json()["detail"] == "SMS text is required"
