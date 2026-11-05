from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database.session import Base

class EmergencyRequest(Base):
    __tablename__ = "emergency_requests"

    # DR-1042 formatted ID
    id = Column(String(50), primary_key=True, index=True)
    sender_phone = Column(String(50), index=True, nullable=False)
    raw_message = Column(Text, nullable=False)
    message_format = Column(String(50), default="NATURAL_LANGUAGE") # STRUCTURED, NATURAL_LANGUAGE
    
    # Classification
    category = Column(String(50), default="OTHER") # MEDICAL, FLOOD, FIRE, RESCUE, MISSING_PERSONS, FOOD_WATER, INFRASTRUCTURE, OTHER
    priority = Column(String(50), default="MEDIUM") # CRITICAL, HIGH, MEDIUM, LOW
    affected_count = Column(Integer, default=1)
    medical_concerns = Column(Text, nullable=True)
    details = Column(Text, nullable=True)
    
    # Location
    location_name = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_type = Column(String(50), default="UNKNOWN") # GPS_EXACT, LANDMARK_APPROX, NETWORK_APPROX, UNKNOWN
    location_confidence = Column(Float, default=0.0) # 0.0 to 1.0
    is_location_missing = Column(Boolean, default=False)
    
    # Status and Operator Action
    status = Column(String(50), default="NEW") # NEW, VERIFIED, REJECTED, RESPONDER_ASSIGNED, IN_PROGRESS, RESOLVED
    verification_notes = Column(Text, nullable=True)
    verified_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    
    assigned_responder_id = Column(Integer, ForeignKey("responders.id"), nullable=True)
    assigned_at = Column(DateTime, nullable=True)
    
    # AI Engine Data
    ai_processed = Column(Boolean, default=False)
    ai_category = Column(String(50), nullable=True)
    ai_priority = Column(String(50), nullable=True)
    ai_summary = Column(Text, nullable=True)
    ai_confidence = Column(Float, default=0.0)
    ai_language_detected = Column(String(50), default="English")
    ai_translated_text = Column(Text, nullable=True)
    is_ai_fallback = Column(Boolean, default=False)
    
    # Store-and-forward tracking
    gateway_id = Column(String(100), nullable=True)
    client_message_id = Column(String(100), unique=True, index=True, nullable=True) # For idempotent deduplication
    sms_received_at = Column(DateTime, default=datetime.utcnow)
    sync_received_at = Column(DateTime, default=datetime.utcnow)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    responder = relationship("Responder", back_populates="emergencies")
    images = relationship("ImageEvidence", back_populates="emergency_request")
    sms_messages = relationship("SMSMessage", back_populates="emergency_request")
