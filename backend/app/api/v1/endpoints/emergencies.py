from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.user import User
from backend.app.models.emergency import EmergencyRequest
from backend.app.schemas.emergency import (
    EmergencyOut, EmergencyUpdate, EmergencyVerification,
    ResponderAssignment
)
from backend.app.services.emergency_service import EmergencyService
from backend.app.security.auth import get_current_user, require_roles
from backend.app.security.privacy import mask_phone_number

router = APIRouter()

@router.get("", response_model=List[EmergencyOut])
def get_all_emergencies(
    status_filter: Optional[str] = Query(None, alias="status"),
    category_filter: Optional[str] = Query(None, alias="category"),
    priority_filter: Optional[str] = Query(None, alias="priority"),
    missing_loc: Optional[bool] = Query(None, alias="missing_location"),
    search: Optional[str] = Query(None),
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    results = EmergencyService.get_emergencies(
        db=db,
        status_filter=status_filter,
        category_filter=category_filter,
        priority_filter=priority_filter,
        is_missing_location=missing_loc,
        search_query=search,
        limit=limit,
        offset=offset
    )
    
    # If user is read-only ANALYST, mask phone numbers for privacy
    if current_user.role == "ANALYST":
        for req in results:
            req.sender_phone = mask_phone_number(req.sender_phone)
            
    return results

@router.get("/{request_id}", response_model=EmergencyOut)
def get_emergency(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    req = EmergencyService.get_by_id(db, request_id)
    if current_user.role == "ANALYST":
        req.sender_phone = mask_phone_number(req.sender_phone)
    return req

@router.patch("/{request_id}", response_model=EmergencyOut)
def update_emergency(
    request_id: str,
    update_data: EmergencyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "OPERATOR"]))
):
    return EmergencyService.update_emergency(db, request_id, update_data, current_user)

@router.post("/{request_id}/verify", response_model=EmergencyOut)
def verify_emergency(
    request_id: str,
    verification: EmergencyVerification,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "OPERATOR"]))
):
    return EmergencyService.verify_emergency(db, request_id, verification, current_user)

@router.post("/{request_id}/assign-responder", response_model=EmergencyOut)
def assign_responder(
    request_id: str,
    assignment: ResponderAssignment,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "OPERATOR"]))
):
    return EmergencyService.assign_responder(db, request_id, assignment, current_user)

@router.post("/{request_id}/send-sms")
def send_manual_sms(
    request_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "OPERATOR"]))
):
    msg_text = payload.get("message_text")
    if not msg_text:
        raise HTTPException(status_code=400, detail="message_text is required.")
    outbound = EmergencyService.send_manual_sms(db, request_id, msg_text, current_user)
    return {"status": "QUEUED", "message_id": outbound.id}
