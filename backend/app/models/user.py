from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from backend.app.database.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="OPERATOR")  # ADMIN, OPERATOR, RESPONDER, ANALYST
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
