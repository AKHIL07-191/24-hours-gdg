from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database.session import Base

class SMSMessage(Base):
    __tablename__ = "sms_messages"

    id = Column(String(100), primary_key=True, index=True)
    direction = Column(String(20), default="INBOUND") # INBOUND, OUTBOUND
    phone_number = Column(String(50), index=True, nullable=False)
    message_text = Column(Text, nullable=False)
    status = Column(String(50), default="RECEIVED") # RECEIVED, QUEUED, SENT, DELIVERED, FAILED
    emergency_request_id = Column(String(50), ForeignKey("emergency_requests.id"), nullable=True)
    gateway_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    sent_at = Column(DateTime, nullable=True)

    # Relationship
    emergency_request = relationship("EmergencyRequest", back_populates="sms_messages")
