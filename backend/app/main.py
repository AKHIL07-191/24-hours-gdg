import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.core.config import settings
from backend.app.database.init_db import init_db, seed_initial_data
from backend.app.database.session import SessionLocal

# Import API Routers
from backend.app.api.v1.endpoints import (
    auth, emergencies, sms, responders, images, analytics, system
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Database tables
    init_db()
    # Seed default roles, responders, and sample emergency incidents
    db = SessionLocal()
    try:
        seed_initial_data(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Disaster-Resilient Emergency Communication and Coordination Platform",
    lifespan=lifespan
)

# CORS setup for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static uploads directory for multimedia deferred pictures
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication & RBAC"])
app.include_router(emergencies.router, prefix=f"{settings.API_V1_STR}/emergencies", tags=["Emergency Operations"])
app.include_router(sms.router, prefix=f"{settings.API_V1_STR}/sms", tags=["SMS Gateway & Store-Forward"])
app.include_router(responders.router, prefix=f"{settings.API_V1_STR}/responders", tags=["Field Responders"])
app.include_router(images.router, prefix=f"{settings.API_V1_STR}/images", tags=["Multimedia Deferred Transmission"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["Disaster Analytics"])
app.include_router(system.router, prefix=f"{settings.API_V1_STR}/system", tags=["System & Audit"])

@app.get("/")
def root():
    return {
        "system": settings.PROJECT_NAME,
        "status": "OPERATIONAL",
        "version": settings.VERSION,
        "docs_url": "/docs",
        "description": "SMS-driven emergency coordination engine functioning under disrupted cellular data connectivity."
    }
