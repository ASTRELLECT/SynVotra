from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Existing schemas...

# New schemas
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleCreate(RoleBase):
    pass

class Role(RoleBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserBase(BaseModel):
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role_id: Optional[int] = None
    contact_number: Optional[str] = None
    dob: Optional[datetime] = None
    address: Optional[str] = None
    profile_picture_url: Optional[str] = None
    joining_date: Optional[datetime] = None
    reporting_manager_id: Optional[int] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_admin: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
