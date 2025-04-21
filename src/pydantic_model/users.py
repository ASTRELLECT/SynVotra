from pydantic import BaseModel, root_validator, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from src.database.models import UserRole
import uuid
from enum import Enum

class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_admin: bool = False
    is_active: bool = True
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        
class UserCreate(BaseModel):
    email: str
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[UserRole] = UserRole.EMPLOYEE
    contact_number: Optional[str] = None
    dob: Optional[datetime] = None
    address: Optional[str] = None
    profile_picture_url: Optional[str] = None
    joining_date: Optional[datetime] = None
    reporting_manager_id: Optional[uuid.UUID] = None
    is_active: bool = True
    is_admin: bool = False

class UserUpdate(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[UserRole] = None
    contact_number: Optional[str] = None
    dob: Optional[datetime] = None
    address: Optional[str] = None
    profile_picture_url: Optional[str] = None
    joining_date: Optional[datetime] = None
    reporting_manager_id: Optional[uuid.UUID] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None

class UserAttribute(BaseModel):
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[UserRole] = None
    contact_number: Optional[str] = None
    dob: Optional[datetime] = None
    address: Optional[str] = None
    joining_date: Optional[datetime] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None

class AvatarType(str, Enum):
    AVATAR_1 = "avatar1"
    AVATAR_2 = "avatar2"

class AvatarUpdate(BaseModel):
    avatar_type: AvatarType