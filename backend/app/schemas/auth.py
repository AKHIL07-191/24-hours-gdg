from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: str
    full_name: str
    role: str = "OPERATOR"
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class ResponderBase(BaseModel):
    name: str
    phone: str
    team_type: str = "RESCUE_BOAT"
    status: str = "AVAILABLE"
    base_location: str = "Central Disaster Response Hub"
    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None

class ResponderCreate(ResponderBase):
    pass

class ResponderUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    team_type: Optional[str] = None
    status: Optional[str] = None
    base_location: Optional[str] = None
    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None

class ResponderOut(ResponderBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
