from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class EmergencyBase(BaseModel):
    category: str = "OTHER"
    priority: str = "MEDIUM"
    affected_count: int = 1
    medical_concerns: Optional[str] = None
    details: Optional[str] = None
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_type: str = "UNKNOWN"
    location_confidence: float = 0.0
    is_location_missing: bool = False

class EmergencyCreate(EmergencyBase):
    raw_message: str
    sender_phone: str
    client_message_id: Optional[str] = None
    gateway_id: Optional[str] = None
    sms_received_at: Optional[datetime] = None

class EmergencyUpdate(BaseModel):
    category: Optional[str] = None
    priority: Optional[str] = None
    affected_count: Optional[int] = None
    medical_concerns: Optional[str] = None
    details: Optional[str] = None
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: Optional[str] = None
    verification_notes: Optional[str] = None
    assigned_responder_id: Optional[int] = None

class EmergencyVerification(BaseModel):
    status: str # VERIFIED or REJECTED
    verification_notes: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    send_sms_update: bool = True

class ResponderAssignment(BaseModel):
    responder_id: int
    notes: Optional[str] = None
    notify_victim_via_sms: bool = True

class ImageEvidenceOut(BaseModel):
    id: str
    emergency_request_id: Optional[str]
    filename: str
    file_path: str
    file_size_bytes: int
    compressed: bool
    deferred_upload: bool
    caption: Optional[str]
    uploaded_at: datetime

    class Config:
        from_attributes = True

class EmergencyOut(EmergencyBase):
    id: str
    sender_phone: str
    raw_message: str
    message_format: str
    status: str
    verification_notes: Optional[str] = None
    verified_by_user_id: Optional[int] = None
    verified_at: Optional[datetime] = None
    assigned_responder_id: Optional[int] = None
    assigned_at: Optional[datetime] = None
    
    ai_processed: bool
    ai_category: Optional[str] = None
    ai_priority: Optional[str] = None
    ai_summary: Optional[str] = None
    ai_confidence: float = 0.0
    ai_language_detected: Optional[str] = "English"
    ai_translated_text: Optional[str] = None
    is_ai_fallback: bool = False
    
    gateway_id: Optional[str] = None
    client_message_id: Optional[str] = None
    sms_received_at: datetime
    sync_received_at: datetime
    created_at: datetime
    updated_at: datetime
    
    images: List[ImageEvidenceOut] = []

    class Config:
        from_attributes = True
