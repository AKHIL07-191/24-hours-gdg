from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from backend.app.database.session import Base

class ImageEvidence(Base):
    __tablename__ = "image_evidence"

    id = Column(String(100), primary_key=True, index=True)
    emergency_request_id = Column(String(50), ForeignKey("emergency_requests.id"), nullable=True)
    sender_phone = Column(String(50), nullable=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    compressed = Column(Boolean, default=True)
    deferred_upload = Column(Boolean, default=False)
    caption = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    emergency_request = relationship("EmergencyRequest", back_populates="images")
