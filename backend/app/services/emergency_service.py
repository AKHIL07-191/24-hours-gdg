import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from fastapi import HTTPException, status

from backend.app.models.emergency import EmergencyRequest
from backend.app.models.responder import Responder
from backend.app.models.sms_message import SMSMessage
from backend.app.models.audit_log import AuditLog
from backend.app.models.user import User
from backend.app.communication.sms_templates import SMSTemplates
from backend.app.schemas.emergency import EmergencyUpdate, EmergencyVerification, ResponderAssignment

class EmergencyService:
    @classmethod
    def get_emergencies(
        cls,
        db: Session,
        status_filter: Optional[str] = None,
        category_filter: Optional[str] = None,
        priority_filter: Optional[str] = None,
        is_missing_location: Optional[bool] = None,
        search_query: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[EmergencyRequest]:
        query = db.query(EmergencyRequest)

        if status_filter:
            query = query.filter(EmergencyRequest.status == status_filter)
        if category_filter:
            query = query.filter(EmergencyRequest.category == category_filter)
        if priority_filter:
            query = query.filter(EmergencyRequest.priority == priority_filter)
        if is_missing_location is not None:
            query = query.filter(EmergencyRequest.is_location_missing == is_missing_location)
        if search_query:
            term = f"%{search_query}%"
            query = query.filter(
                or_(
                    EmergencyRequest.id.ilike(term),
                    EmergencyRequest.sender_phone.ilike(term),
                    EmergencyRequest.location_name.ilike(term),
                    EmergencyRequest.raw_message.ilike(term),
                    EmergencyRequest.ai_summary.ilike(term)
                )
            )

        return query.order_by(desc(EmergencyRequest.created_at)).offset(offset).limit(limit).all()

    @classmethod
    def get_by_id(cls, db: Session, request_id: str) -> EmergencyRequest:
        req = db.query(EmergencyRequest).filter(EmergencyRequest.id == request_id).first()
        if not req:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Emergency request {request_id} not found."
            )
        return req

    @classmethod
    def update_emergency(
        cls,
        db: Session,
        request_id: str,
        update_data: EmergencyUpdate,
        current_user: User
    ) -> EmergencyRequest:
        req = cls.get_by_id(db, request_id)
        
        data_dict = update_data.model_dump(exclude_unset=True)
        for key, val in data_dict.items():
            if val is not None:
                setattr(req, key, val)
        
        # If location or coordinates were manually edited, update location_type
        if update_data.latitude is not None and update_data.longitude is not None:
            req.location_type = "GPS_EXACT"
            req.location_confidence = 1.0
            req.is_location_missing = False

        req.updated_at = datetime.utcnow()
        
        audit = AuditLog(
            user_email=current_user.email,
            action="UPDATE_EMERGENCY_DETAILS",
            resource_type="EMERGENCY_REQUEST",
            resource_id=req.id,
            details=f"Updated fields: {list(data_dict.keys())}"
        )
        db.add(audit)
        db.commit()
        db.refresh(req)
        return req

    @classmethod
    def verify_emergency(
        cls,
        db: Session,
        request_id: str,
        verification: EmergencyVerification,
        current_user: User
    ) -> EmergencyRequest:
        req = cls.get_by_id(db, request_id)
        
        req.status = verification.status
        req.verification_notes = verification.verification_notes
        req.verified_by_user_id = current_user.id
        req.verified_at = datetime.utcnow()
        
        if verification.priority:
            req.priority = verification.priority
        if verification.category:
            req.category = verification.category

        # Send SMS update to victim if requested
        if verification.send_sms_update:
            msg_text = SMSTemplates.under_review(req.id) if verification.status == "VERIFIED" else f"RESQ-NET: Update on request {req.id}: {verification.verification_notes or 'Closed'}"
            outbound_msg = SMSMessage(
                id=f"out_{uuid.uuid4().hex[:12]}",
                direction="OUTBOUND",
                phone_number=req.sender_phone,
                message_text=msg_text,
                status="QUEUED",
                emergency_request_id=req.id,
                gateway_id=req.gateway_id,
                created_at=datetime.utcnow()
            )
            db.add(outbound_msg)

        audit = AuditLog(
            user_email=current_user.email,
            action=f"VERIFY_STATUS_{verification.status}",
            resource_type="EMERGENCY_REQUEST",
            resource_id=req.id,
            details=f"Verified by {current_user.full_name}. Notes: {verification.verification_notes}"
        )
        db.add(audit)
        db.commit()
        db.refresh(req)
        return req

    @classmethod
    def assign_responder(
        cls,
        db: Session,
        request_id: str,
        assignment: ResponderAssignment,
        current_user: User
    ) -> EmergencyRequest:
        req = cls.get_by_id(db, request_id)
        responder = db.query(Responder).filter(Responder.id == assignment.responder_id).first()
        
        if not responder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Responder team ID {assignment.responder_id} not found."
            )

        req.assigned_responder_id = responder.id
        req.assigned_at = datetime.utcnow()
        req.status = "RESPONDER_ASSIGNED"
        responder.status = "DISPATCHED"

        if assignment.notes:
            req.verification_notes = f"{req.verification_notes or ''}\n[DISPATCH NOTE]: {assignment.notes}".strip()

        # Notify victim via SMS
        if assignment.notify_victim_via_sms:
            dispatch_sms = SMSTemplates.responder_dispatched(
                request_id=req.id,
                team_name=responder.name,
                team_phone=responder.phone
            )
            outbound_msg = SMSMessage(
                id=f"out_{uuid.uuid4().hex[:12]}",
                direction="OUTBOUND",
                phone_number=req.sender_phone,
                message_text=dispatch_sms,
                status="QUEUED",
                emergency_request_id=req.id,
                gateway_id=req.gateway_id,
                created_at=datetime.utcnow()
            )
            db.add(outbound_msg)

        audit = AuditLog(
            user_email=current_user.email,
            action="ASSIGN_RESPONDER",
            resource_type="EMERGENCY_REQUEST",
            resource_id=req.id,
            details=f"Assigned responder {responder.name} ({responder.team_type})"
        )
        db.add(audit)
        db.commit()
        db.refresh(req)
        return req

    @classmethod
    def send_manual_sms(
        cls,
        db: Session,
        request_id: str,
        message_text: str,
        current_user: User
    ) -> SMSMessage:
        req = cls.get_by_id(db, request_id)
        outbound = SMSMessage(
            id=f"out_{uuid.uuid4().hex[:12]}",
            direction="OUTBOUND",
            phone_number=req.sender_phone,
            message_text=message_text,
            status="QUEUED",
            emergency_request_id=req.id,
            gateway_id=req.gateway_id,
            created_at=datetime.utcnow()
        )
        db.add(outbound)
        
        audit = AuditLog(
            user_email=current_user.email,
            action="SEND_MANUAL_SMS",
            resource_type="SMS",
            resource_id=outbound.id,
            details=f"Operator {current_user.email} sent SMS to {req.sender_phone}: {message_text}"
        )
        db.add(audit)
        db.commit()
        db.refresh(outbound)
        return outbound
