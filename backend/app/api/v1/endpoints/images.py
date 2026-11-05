import os
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from PIL import Image
import io

from backend.app.core.config import settings
from backend.app.database.session import get_db
from backend.app.models.image_evidence import ImageEvidence
from backend.app.models.emergency import EmergencyRequest
from backend.app.models.audit_log import AuditLog
from backend.app.models.user import User
from backend.app.security.auth import get_current_user

router = APIRouter()

MAX_IMAGE_DIMENSION = 1280
JPEG_QUALITY = 75

@router.post("/upload")
async def upload_deferred_image(
    file: UploadFile = File(...),
    emergency_request_id: Optional[str] = Form(None),
    sender_phone: Optional[str] = Form(None),
    caption: Optional[str] = Form(None),
    deferred_upload: bool = Form(True),
    db: Session = Depends(get_db)
):
    """
    Accepts deferred image transmission from victim or field responder.
    Compresses image to minimize bandwidth and associates with the emergency ID.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be an image."
        )

    # If emergency_request_id was not directly provided, try to find the latest active request for the phone number
    target_req_id = emergency_request_id
    if not target_req_id and sender_phone:
        latest = db.query(EmergencyRequest).filter(
            EmergencyRequest.sender_phone == sender_phone
        ).order_by(EmergencyRequest.created_at.desc()).first()
        if latest:
            target_req_id = latest.id

    # Read bytes and compress using PIL
    file_bytes = await file.read()
    raw_size = len(file_bytes)
    
    try:
        pil_img = Image.open(io.BytesIO(file_bytes))
        # Convert RGBA to RGB for JPEG compatibility
        if pil_img.mode in ("RGBA", "P"):
            pil_img = pil_img.convert("RGB")
        
        # Resize if dimensions exceed threshold
        pil_img.thumbnail((MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION), Image.Resampling.LANCZOS)
        
        # Save compressed to disk
        ext = ".jpg"
        file_id = f"img_{uuid.uuid4().hex[:12]}"
        safe_filename = f"{file_id}_{int(datetime.utcnow().timestamp())}{ext}"
        save_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
        
        pil_img.save(save_path, "JPEG", optimize=True, quality=JPEG_QUALITY)
        compressed_size = os.path.getsize(save_path)
    except Exception as e:
        # Fallback to direct raw save if Pillow fails
        file_id = f"img_{uuid.uuid4().hex[:12]}"
        safe_filename = f"{file_id}_{file.filename}"
        save_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
        with open(save_path, "wb") as f:
            f.write(file_bytes)
        compressed_size = raw_size

    # Record in database
    image_record = ImageEvidence(
        id=file_id,
        emergency_request_id=target_req_id,
        sender_phone=sender_phone,
        filename=safe_filename,
        file_path=save_path,
        file_size_bytes=compressed_size,
        compressed=True,
        deferred_upload=deferred_upload,
        caption=caption or f"Transmitted deferred image for {target_req_id or 'incident'}",
        uploaded_at=datetime.utcnow()
    )
    db.add(image_record)

    audit = AuditLog(
        user_email="MULTIMEDIA_DEFERRED_UPLOADER",
        action="DEFERRED_IMAGE_UPLOADED",
        resource_type="IMAGE_EVIDENCE",
        resource_id=file_id,
        details=f"Associated with {target_req_id or 'UNLINKED'}. Raw: {raw_size}B, Compressed: {compressed_size}B."
    )
    db.add(audit)
    db.commit()
    db.refresh(image_record)

    return {
        "status": "SUCCESS",
        "image_id": image_record.id,
        "emergency_request_id": target_req_id,
        "filename": safe_filename,
        "compressed_size_bytes": compressed_size,
        "compression_ratio": f"{round((1 - compressed_size / max(raw_size, 1)) * 100, 1)}%",
        "url": f"/api/v1/images/{file_id}/file"
    }

@router.get("/list")
def list_images(
    emergency_request_id: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ImageEvidence)
    if emergency_request_id:
        query = query.filter(ImageEvidence.emergency_request_id == emergency_request_id)
    return query.order_by(ImageEvidence.uploaded_at.desc()).limit(limit).all()

@router.get("/{image_id}/file")
def get_image_file(image_id: str, db: Session = Depends(get_db)):
    record = db.query(ImageEvidence).filter(ImageEvidence.id == image_id).first()
    if not record or not os.path.exists(record.file_path):
        raise HTTPException(status_code=404, detail="Image file not found")
    return FileResponse(record.file_path, media_type="image/jpeg")
