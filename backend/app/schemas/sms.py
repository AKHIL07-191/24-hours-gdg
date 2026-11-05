from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class InboundSMS(BaseModel):
    message_id: Optional[str] = None  # Gateway local message ID
    sender: str                       # Phone number
    text: str                         # SMS message body
    timestamp: Optional[datetime] = None
    gateway_id: Optional[str] = "ANDROID_GATEWAY_01"

class GatewaySyncBatch(BaseModel):
    gateway_id: str
    messages: List[InboundSMS]
    sync_token: Optional[str] = None

class OutboundSMSCreate(BaseModel):
    phone_number: str
    message_text: str
    emergency_request_id: Optional[str] = None

class OutboundSMSResponse(BaseModel):
    id: str
    phone_number: str
    message_text: str
    status: str
    emergency_request_id: Optional[str] = None
    sent_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class GatewayPendingMessagesResponse(BaseModel):
    gateway_id: str
    pending_sms: List[OutboundSMSResponse]
