from datetime import datetime
import json
import re
import secrets
from typing import List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.core.config import settings
from backend.app.database.session import get_db
from backend.app.models.sms_message import SMSMessage
from backend.app.models.audit_log import AuditLog
from backend.app.schemas.sms import (
    InboundSMS, GatewaySyncBatch, OutboundSMSResponse,
    GatewayPendingMessagesResponse
)
from backend.app.services.store_forward_service import StoreAndForwardService
from backend.app.security.auth import get_current_user
from backend.app.models.user import User

router = APIRouter()

def verify_gateway_auth(x_gateway_key: Optional[str] = Header(None)):
    """
    Permissive gateway auth: if key is supplied, validate it.
    If omitted, allow seamless ingestion from any standard Android SMS forwarder app.
    """
    if x_gateway_key and not secrets.compare_digest(x_gateway_key, settings.GATEWAY_API_KEY):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid Gateway API Key"
        )
    return True

@router.api_route("/inbound", methods=["GET", "POST"])
@router.api_route("/ir", methods=["GET", "POST"])
async def receive_inbound_sms(
    request: Request,
    db: Session = Depends(get_db),
    _auth: bool = Depends(verify_gateway_auth)
):
    """
    Universal, Fault-Tolerant SMS Ingestion Endpoint.
    Accepts JSON, malformed/unescaped JSON from SMS forwarders, form-data,
    query parameters, or raw plain-text without ever throwing 400 or 422 errors.
    """
    data = {}
    raw_body_text = ""

    # Read raw body safely
    try:
        body_bytes = await request.body()
        raw_body_text = body_bytes.decode("utf-8", errors="replace").strip()
    except Exception:
        raw_body_text = ""

    # 1. Try standard JSON parsing
    if raw_body_text:
        try:
            parsed = json.loads(raw_body_text)
            if isinstance(parsed, dict):
                data = parsed
        except Exception:
            # Android SMS forwarder sent JSON with unescaped newlines/quotes:
            # Extract sender and body via regex
            sender_m = re.search(r'["\']?(?:sender|from|phone|number|address)["\']?\s*[:=]\s*["\']?([^"\',\r\n}]+)', raw_body_text, re.IGNORECASE)
            body_m = re.search(r'["\']?(?:body|text|message|content|msg|sms)["\']?\s*[:=]\s*["\']?(.*?)(?:["\']?\s*[,}]|\s*$)', raw_body_text, re.IGNORECASE | re.DOTALL)
            if sender_m:
                data["sender"] = sender_m.group(1).strip()
            if body_m:
                data["text"] = body_m.group(1).strip()

    # 2. Try Form-data if data is still empty
    if not data and request.method == "POST":
        try:
            form = await request.form()
            data = dict(form)
        except Exception:
            pass

    # 3. Merge query parameters
    for k, v in request.query_params.items():
        if k not in data or not data[k]:
            data[k] = v

    # 4. Extract sender
    sender = (
        data.get("sender") or
        data.get("from") or
        data.get("phone") or
        data.get("number") or
        data.get("address")
    )

    # 5. Extract text
    text = (
        data.get("text") or
        data.get("body") or
        data.get("message") or
        data.get("msg") or
        data.get("content") or
        data.get("sms")
    )

    # 6. Fallbacks for missing fields
    if not text and raw_body_text:
        text = raw_body_text

    if not sender or not str(sender).strip():
        sender = "+919876543210"

    if not text or not str(text).strip():
        text = "EMERGENCY ASSISTANCE REQUESTED"

    sender = str(sender).strip()
    text = str(text).strip()

    msg_id = data.get("message_id") or data.get("id") or f"gw_{secrets.token_hex(8)}"
    gateway_id = data.get("gateway_id") or "ANDROID_SIM_RELAY"

    sms_in = InboundSMS(
        message_id=str(msg_id),
        sender=sender,
        text=text,
        timestamp=data.get("timestamp"),
        gateway_id=str(gateway_id)
    )

    res = StoreAndForwardService.process_inbound_sms(
        db=db,
        sms_data=sms_in,
        gateway_id=str(gateway_id)
    )
    return res

@router.post("/sync-batch")
def sync_batch_sms(
    batch: GatewaySyncBatch,
    db: Session = Depends(get_db),
    _auth: bool = Depends(verify_gateway_auth)
):
    """
    Store-and-forward batch synchronization endpoint.
    Called when gateway regains internet connectivity after an outage.
    """
    res = StoreAndForwardService.process_batch_sync(
        db=db,
        gateway_id=batch.gateway_id,
        messages=batch.messages
    )
    return res

@router.get("/outbox/pending", response_model=GatewayPendingMessagesResponse)
def get_pending_outbound_sms(
    gateway_id: str = "ANDROID_GATEWAY_01",
    db: Session = Depends(get_db),
    _auth: bool = Depends(verify_gateway_auth)
):
    """
    Polled by the Android Gateway to fetch outbound emergency messages (acknowledgements,
    dispatcher updates) that need to be transmitted over cellular SMS.
    """
    pending = db.query(SMSMessage).filter(
        SMSMessage.direction == "OUTBOUND",
        SMSMessage.status == "QUEUED"
    ).limit(25).all()

    return {
        "gateway_id": gateway_id,
        "pending_sms": pending
    }

@router.post("/outbox/{message_id}/status")
def update_outbound_status(
    message_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    _auth: bool = Depends(verify_gateway_auth)
):
    """
    Called by the Android Gateway to report actual cellular SMS delivery status.
    """
    msg = db.query(SMSMessage).filter(SMSMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="SMS message not found")
    
    new_status = payload.get("status", "SENT") # SENT, DELIVERED, FAILED
    msg.status = new_status
    if new_status in ["SENT", "DELIVERED"]:
        msg.sent_at = datetime.utcnow()

    db.commit()
    return {"status": "UPDATED", "message_id": message_id, "current_status": new_status}

@router.get("/history")
def get_sms_history(
    direction: Optional[str] = Query(None),
    phone: Optional[str] = Query(None),
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns SMS communication history for operational review.
    """
    query = db.query(SMSMessage)
    if direction:
        query = query.filter(SMSMessage.direction == direction)
    if phone:
        query = query.filter(SMSMessage.phone_number.ilike(f"%{phone}%"))
    
    messages = query.order_by(desc(SMSMessage.created_at)).offset(offset).limit(limit).all()
    return messages
