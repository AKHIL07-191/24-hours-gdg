from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database.session import get_db
from backend.app.models.audit_log import AuditLog
from backend.app.models.user import User
from backend.app.security.auth import get_current_user, require_roles
from backend.app.database.init_db import seed_initial_data

router = APIRouter()

@router.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "RESQ-NET Disaster-Resilient Emergency Communication Engine",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "CONNECTED",
        "version": "1.0.0"
    }

@router.get("/audit-logs")
def get_audit_logs(
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "OPERATOR"]))
):
    logs = db.query(AuditLog).order_by(desc(AuditLog.timestamp)).offset(offset).limit(limit).all()
    return logs

@router.post("/seed-demo-data")
def trigger_seed_demo_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN"]))
):
    count = seed_initial_data(db)
    return {"status": "SUCCESS", "records_seeded": count}
