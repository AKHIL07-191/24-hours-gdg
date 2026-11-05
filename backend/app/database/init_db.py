from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from backend.app.database.session import engine, Base
from backend.app.models.user import User
from backend.app.models.responder import Responder
from backend.app.models.emergency import EmergencyRequest
from backend.app.models.sms_message import SMSMessage
from backend.app.models.audit_log import AuditLog
from backend.app.models.image_evidence import ImageEvidence
from backend.app.security.auth import get_password_hash

def init_db():
    Base.metadata.create_all(bind=engine)

def seed_initial_data(db: Session) -> int:
    # 1. Seed Users if not present
    if not db.query(User).filter(User.email == "admin@resqnet.org").first():
        users = [
            User(
                email="admin@resqnet.org",
                hashed_password=get_password_hash("admin123"),
                full_name="Chief Disaster Operations Officer",
                role="ADMIN",
                is_active=True
            ),
            User(
                email="operator@resqnet.org",
                hashed_password=get_password_hash("operator123"),
                full_name="Ananya Sharma (Command Dispatcher)",
                role="OPERATOR",
                is_active=True
            ),
            User(
                email="responder@resqnet.org",
                hashed_password=get_password_hash("responder123"),
                full_name="Captain Rajesh Verma (NDRF Unit 4)",
                role="RESPONDER",
                is_active=True
            ),
            User(
                email="analyst@resqnet.org",
                hashed_password=get_password_hash("analyst123"),
                full_name="Dr. Priya Rao (Disaster Research Analyst)",
                role="ANALYST",
                is_active=True
            )
        ]
        db.add_all(users)
        db.commit()

    # 2. Seed Field Responders
    if db.query(Responder).count() == 0:
        responders = [
            Responder(
                name="NDRF Coastal Rescue Boat Alpha",
                phone="+919811223344",
                team_type="RESCUE_BOAT",
                status="AVAILABLE",
                base_location="Vizag Harbor Staging Point",
                current_latitude=17.6950,
                current_longitude=83.2980
            ),
            Responder(
                name="Rapid Trauma Medical Evac Unit 1",
                phone="+919811223355",
                team_type="MEDICAL",
                status="AVAILABLE",
                base_location="King George Hospital Trauma Base",
                current_latitude=17.7060,
                current_longitude=83.3045
            ),
            Responder(
                name="Disaster Fire & Hazmat Brigade 3",
                phone="+919811223366",
                team_type="FIRE_HAZMAT",
                status="AVAILABLE",
                base_location="Dwaraka Nagar Fire Hub",
                current_latitude=17.7280,
                current_longitude=83.3080
            ),
            Responder(
                name="Heavy Inundation Evacuation Unit 2",
                phone="+919811223377",
                team_type="EVACUATION",
                status="AVAILABLE",
                base_location="Madhurawada Relief Camp",
                current_latitude=17.8020,
                current_longitude=83.3520
            ),
            Responder(
                name="Emergency Rations & Potable Water Supply",
                phone="+919811223388",
                team_type="SUPPLIES",
                status="AVAILABLE",
                base_location="Gajuwaka Civil Defense Depot",
                current_latitude=17.6920,
                current_longitude=83.1670
            )
        ]
        db.add_all(responders)
        db.commit()

    # 3. Clean start: No pre-defined emergency data. Only user-submitted real messages are displayed.
    return 0
