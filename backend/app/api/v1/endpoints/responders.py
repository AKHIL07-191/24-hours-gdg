from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database.session import get_db
from backend.app.models.responder import Responder
from backend.app.models.audit_log import AuditLog
from backend.app.schemas.auth import ResponderCreate, ResponderUpdate, ResponderOut
from backend.app.security.auth import get_current_user, require_roles
from backend.app.models.user import User

router = APIRouter()

@router.get("", response_model=List[ResponderOut])
def list_responders(
    status_filter: Optional[str] = Query(None, alias="status"),
    team_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Responder)
    if status_filter:
        query = query.filter(Responder.status == status_filter)
    if team_type:
        query = query.filter(Responder.team_type == team_type)
    return query.order_by(Responder.name).all()

@router.post("", response_model=ResponderOut)
def create_responder(
    resp_in: ResponderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "OPERATOR"]))
):
    responder = Responder(
        name=resp_in.name,
        phone=resp_in.phone,
        team_type=resp_in.team_type,
        status=resp_in.status,
        base_location=resp_in.base_location,
        current_latitude=resp_in.current_latitude,
        current_longitude=resp_in.current_longitude
    )
    db.add(responder)
    db.commit()
    db.refresh(responder)

    audit = AuditLog(
        user_email=current_user.email,
        action="CREATE_RESPONDER",
        resource_type="RESPONDER",
        resource_id=str(responder.id),
        details=f"Created responder team: {responder.name} ({responder.team_type})"
    )
    db.add(audit)
    db.commit()

    return responder

@router.patch("/{responder_id}", response_model=ResponderOut)
def update_responder(
    responder_id: int,
    update_data: ResponderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "OPERATOR", "RESPONDER"]))
):
    responder = db.query(Responder).filter(Responder.id == responder_id).first()
    if not responder:
        raise HTTPException(status_code=404, detail="Responder not found")

    data = update_data.model_dump(exclude_unset=True)
    for key, val in data.items():
        if val is not None:
            setattr(responder, key, val)

    audit = AuditLog(
        user_email=current_user.email,
        action="UPDATE_RESPONDER",
        resource_type="RESPONDER",
        resource_id=str(responder.id),
        details=f"Updated responder details: {list(data.keys())}"
    )
    db.add(audit)
    db.commit()
    db.refresh(responder)
    return responder
