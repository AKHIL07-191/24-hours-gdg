from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from backend.app.database.session import Base

class Responder(Base):
    __tablename__ = "responders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    phone = Column(String(50), nullable=False)
    team_type = Column(String(50), default="RESCUE_BOAT") # MEDICAL, RESCUE_BOAT, FIRE_HAZMAT, EVACUATION, SUPPLIES
    status = Column(String(50), default="AVAILABLE") # AVAILABLE, DISPATCHED, EN_ROUTE, ON_SCENE, OFF_DUTY
    base_location = Column(String(255), default="Central Disaster Response Hub")
    current_latitude = Column(Float, nullable=True)
    current_longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    emergencies = relationship("EmergencyRequest", back_populates="responder")
