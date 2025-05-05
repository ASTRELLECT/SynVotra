from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime
from src.database.models import UserRole
from enum import Enum
import uuid

    
class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[UserRole] = None
    contact_number: Optional[str] = None
    dob: Optional[datetime] = None
    address: Optional[str] = None
    profile_picture_url: Optional[str] = None
    joining_date: Optional[datetime] = None
    reporting_manager_id: Optional[uuid.UUID] = None
    is_active: bool = True
    is_admin: bool = False
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserListResponse(BaseModel):
    result : List[UserResponse]
    
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

class AvatarUpdate(BaseModel):
    avatar_id: int