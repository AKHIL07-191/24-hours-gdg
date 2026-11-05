import os
from typing import Optional

class Settings:
    PROJECT_NAME: str = "RESQ-NET Emergency Response System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "resqnet-disaster-resilient-emergency-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database (defaults to SQLite; PostgreSQL supported seamlessly via DATABASE_URL)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./resqnet.db")
    
    # AI - Gemini API
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", None)
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    
    # Media Storage
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
    
    # SMS Gateway Shared Secret
    GATEWAY_API_KEY: str = os.getenv("GATEWAY_API_KEY", "resqnet-gateway-token-secret")
    
    # Default Coordinates (Coastal disaster context e.g. Visakhapatnam region)
    DEFAULT_LAT: float = 17.7234
    DEFAULT_LNG: float = 83.3012

settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
