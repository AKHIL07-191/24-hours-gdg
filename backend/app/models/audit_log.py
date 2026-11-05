from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from backend.app.database.session import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_email = Column(String(255), nullable=True)
    action = Column(String(100), nullable=False) # e.g. VERIFY_REQUEST, REJECT_REQUEST, ASSIGN_RESPONDER, SEND_SMS, SYNC_GATEWAY
    resource_type = Column(String(100), nullable=False) # e.g. EMERGENCY_REQUEST, SMS, RESPONDER
    resource_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
