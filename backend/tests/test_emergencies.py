import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.database.session import Base
from backend.app.services.emergency_service import EmergencyService
from backend.app.models.emergency import EmergencyRequest
from backend.app.models.responder import Responder
from backend.app.models.user import User
from backend.app.schemas.emergency import EmergencyVerification, ResponderAssignment

@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()

    # Seed an operator user
    user = User(id=1, email="op@resqnet.org", hashed_password="pw", full_name="Operator 1", role="OPERATOR")
    session.add(user)

    # Seed a responder
    responder = Responder(id=1, name="Rescue Unit 1", phone="+919999911111", team_type="RESCUE_BOAT", status="AVAILABLE")
    session.add(responder)

    # Seed an emergency
    req = EmergencyRequest(
        id="DR-1099",
        sender_phone="+919848011221",
        raw_message="HELP|FLOOD|VIZAG|3 PEOPLE",
        category="FLOOD",
        priority="HIGH",
        status="NEW",
        affected_count=3
    )
    session.add(req)
    session.commit()

    yield session
    session.close()

def test_human_operator_verification(db):
    user = db.query(User).first()
    verif = EmergencyVerification(status="VERIFIED", verification_notes="Coordinates confirmed with SDRF map", priority="CRITICAL")
    
    updated = EmergencyService.verify_emergency(db, "DR-1099", verif, user)
    assert updated.status == "VERIFIED"
    assert updated.priority == "CRITICAL"
    assert updated.verified_by_user_id == user.id
    assert "Coordinates confirmed" in updated.verification_notes

def test_responder_assignment_and_dispatch(db):
    user = db.query(User).first()
    assign = ResponderAssignment(responder_id=1, notes="Deploying life rafts", notify_victim_via_sms=True)
    
    updated = EmergencyService.assign_responder(db, "DR-1099", assign, user)
    assert updated.status == "RESPONDER_ASSIGNED"
    assert updated.assigned_responder_id == 1

    # Check responder status changed to DISPATCHED
    resp = db.query(Responder).filter(Responder.id == 1).first()
    assert resp.status == "DISPATCHED"
