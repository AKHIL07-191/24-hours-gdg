import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.models.emergency import EmergencyRequest
from backend.app.models.sms_message import SMSMessage
from backend.app.models.audit_log import AuditLog
from backend.app.ai.gemini_client import GeminiEmergencyAI
from backend.app.communication.sms_templates import SMSTemplates
from backend.app.schemas.sms import InboundSMS

class StoreAndForwardService:
    @classmethod
    def generate_next_request_id(cls, db: Session) -> str:
        """Generates predictable human-friendly sequential ID e.g. DR-1042"""
        count = db.query(func.count(EmergencyRequest.id)).scalar() or 0
        return f"DR-{1001 + count}"

    @classmethod
    def process_inbound_sms(
        cls,
        db: Session,
        sms_data: InboundSMS,
        gateway_id: str = "ANDROID_GATEWAY_01"
    ) -> Dict[str, Any]:
        """
        Processes a single incoming SMS with store-and-forward idempotency.
        """
        # 1. Idempotency check: if client_message_id is provided and already exists, return existing
        client_msg_id = sms_data.message_id or f"sms_{uuid.uuid4().hex[:12]}"
        existing = db.query(EmergencyRequest).filter(
            EmergencyRequest.client_message_id == client_msg_id
        ).first()

        if existing:
            return {
                "status": "DUPLICATE_SUPPRESSED",
                "message": "Message already processed idempotently.",
                "request_id": existing.id,
                "category": existing.category,
                "existing": True
            }

        # 2. Query active emergencies for duplicate detection context
        active_records = db.query(EmergencyRequest).filter(
            EmergencyRequest.status.in_(["NEW", "VERIFIED", "RESPONDER_ASSIGNED", "IN_PROGRESS"])
        ).limit(50).all()
        
        active_list = [
            {
                "id": r.id,
                "category": r.category,
                "location_name": r.location_name,
                "latitude": r.latitude,
                "longitude": r.longitude,
                "status": r.status
            }
            for r in active_records
        ]

        # 3. Process with AI / Fallback Parser
        ai_res = GeminiEmergencyAI.analyze_emergency_sms(
            text=sms_data.text,
            sender_phone=sms_data.sender,
            active_emergencies=active_list
        )

        # 4. Generate unique Emergency ID
        req_id = cls.generate_next_request_id(db)

        # 5. Create EmergencyRequest record
        now = datetime.utcnow()
        emergency = EmergencyRequest(
            id=req_id,
            sender_phone=sms_data.sender,
            raw_message=sms_data.text,
            message_format=ai_res.get("message_format", "NATURAL_LANGUAGE"),
            category=ai_res.get("category", "OTHER"),
            priority=ai_res.get("priority", "MEDIUM"),
            affected_count=ai_res.get("affected_count", 1),
            medical_concerns=ai_res.get("medical_concerns"),
            details=ai_res.get("details"),
            location_name=ai_res.get("location_name"),
            latitude=ai_res.get("latitude"),
            longitude=ai_res.get("longitude"),
            location_type=ai_res.get("location_type", "UNKNOWN"),
            location_confidence=ai_res.get("confidence_score", 0.5) if ai_res.get("latitude") else 0.4,
            is_location_missing=ai_res.get("is_location_missing", False),
            status="NEW",
            ai_processed=True,
            ai_category=ai_res.get("category"),
            ai_priority=ai_res.get("priority"),
            ai_summary=ai_res.get("ai_summary"),
            ai_confidence=ai_res.get("confidence_score", 0.8),
            ai_language_detected=ai_res.get("language_detected", "English"),
            ai_translated_text=ai_res.get("translated_text"),
            is_ai_fallback=ai_res.get("is_ai_fallback", False),
            gateway_id=gateway_id,
            client_message_id=client_msg_id,
            sms_received_at=sms_data.timestamp or now,
            sync_received_at=now,
            created_at=now,
            updated_at=now
        )
        db.add(emergency)

        # 6. Record Inbound SMS Log
        inbound_log = SMSMessage(
            id=f"in_{uuid.uuid4().hex[:12]}",
            direction="INBOUND",
            phone_number=sms_data.sender,
            message_text=sms_data.text,
            status="RECEIVED",
            emergency_request_id=req_id,
            gateway_id=gateway_id,
            created_at=now,
            sent_at=sms_data.timestamp or now
        )
        db.add(inbound_log)

        # 7. Automatically Queue Outbound Acknowledgement SMS
        ack_text = SMSTemplates.acknowledgement(req_id)
        if emergency.is_location_missing:
            # If location is missing, immediately prompt for location in outgoing SMS
            ack_text = SMSTemplates.missing_location(req_id)

        outbound_ack = SMSMessage(
            id=f"out_{uuid.uuid4().hex[:12]}",
            direction="OUTBOUND",
            phone_number=sms_data.sender,
            message_text=ack_text,
            status="QUEUED",
            emergency_request_id=req_id,
            gateway_id=gateway_id,
            created_at=now
        )
        db.add(outbound_ack)

        # 8. Record Audit Log
        audit = AuditLog(
            user_email="SYSTEM_GATEWAY",
            action="INGEST_EMERGENCY_SMS",
            resource_type="EMERGENCY_REQUEST",
            resource_id=req_id,
            details=f"Received via gateway {gateway_id}. Format: {emergency.message_format}. Missing loc: {emergency.is_location_missing}"
        )
        db.add(audit)

        db.commit()
        db.refresh(emergency)

        return {
            "status": "PROCESSED",
            "request_id": req_id,
            "category": emergency.category,
            "priority": emergency.priority,
            "is_location_missing": emergency.is_location_missing,
            "ack_queued": True,
            "ack_message": ack_text,
            "reply": ack_text,
            "message": ack_text,
            "reply_to": sms_data.sender,
            "existing": False
        }

    @classmethod
    def process_batch_sync(
        cls,
        db: Session,
        gateway_id: str,
        messages: List[InboundSMS]
    ) -> Dict[str, Any]:
        """
        Synchronizes a queued batch of SMS messages collected while gateway was offline.
        """
        processed_count = 0
        duplicate_count = 0
        results = []

        for msg in messages:
            res = cls.process_inbound_sms(db, msg, gateway_id=gateway_id)
            if res.get("status") == "DUPLICATE_SUPPRESSED":
                duplicate_count += 1
            else:
                processed_count += 1
            results.append(res)

        return {
            "gateway_id": gateway_id,
            "batch_total": len(messages),
            "processed_count": processed_count,
            "duplicate_count": duplicate_count,
            "synced_at": datetime.utcnow().isoformat(),
            "results": results
        }
