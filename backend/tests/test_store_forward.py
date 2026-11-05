import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.database.session import Base
from backend.app.services.store_forward_service import StoreAndForwardService
from backend.app.schemas.sms import InboundSMS
from backend.app.models.emergency import EmergencyRequest
from backend.app.models.sms_message import SMSMessage

@pytest.fixture
def db():
    # In-memory SQLite for testing
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()

def test_idempotent_sms_ingestion(db):
    msg = InboundSMS(
        message_id="unique_gateway_msg_101",
        sender="+919848011221",
        text="HELP|MED|17.7234,83.3012|2INJ|LOWBAT"
    )

    # First ingestion
    res1 = StoreAndForwardService.process_inbound_sms(db, msg, gateway_id="GATEWAY_TEST")
    assert res1["status"] == "PROCESSED"
    assert res1["existing"] is False
    assert res1["request_id"].startswith("DR-")

    # Second ingestion with same message_id should be suppressed as duplicate
    res2 = StoreAndForwardService.process_inbound_sms(db, msg, gateway_id="GATEWAY_TEST")
    assert res2["status"] == "DUPLICATE_SUPPRESSED"
    assert res2["existing"] is True
    assert res2["request_id"] == res1["request_id"]

    # Verify only 1 EmergencyRequest was created in DB
    count = db.query(EmergencyRequest).count()
    assert count == 1

def test_automatic_acknowledgement_generation(db):
    msg = InboundSMS(
        message_id="unique_gateway_msg_102",
        sender="+919848022332",
        text="HELP|FLOOD|VIZAG|4 PEOPLE|1 ELDERLY"
    )

    res = StoreAndForwardService.process_inbound_sms(db, msg, gateway_id="GATEWAY_TEST")
    req_id = res["request_id"]

    # Check that outbound acknowledgement was queued
    outbound = db.query(SMSMessage).filter(
        SMSMessage.emergency_request_id == req_id,
        SMSMessage.direction == "OUTBOUND"
    ).first()

    assert outbound is not None
    assert outbound.status == "QUEUED"
    assert req_id in outbound.message_text

def test_missing_location_outgoing_prompt(db):
    msg = InboundSMS(
        message_id="unique_gateway_msg_103",
        sender="+919848033443",
        text="HELP|FOOD|NO LOCATION|NEED RATIONS"
    )

    res = StoreAndForwardService.process_inbound_sms(db, msg, gateway_id="GATEWAY_TEST")
    req_id = res["request_id"]

    outbound = db.query(SMSMessage).filter(
        SMSMessage.emergency_request_id == req_id,
        SMSMessage.direction == "OUTBOUND"
    ).first()

    assert outbound is not None
    assert "lacks location" in outbound.message_text.lower()
