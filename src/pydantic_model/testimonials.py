from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid
from enum import Enum

class TestimonialStatus(str, Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"

class TestimonialBase(BaseModel):
    content: str

class TestimonialCreate(TestimonialBase):
    pass

class TestimonialUpdate(BaseModel):
    content: Optional[str] = None

class TestimonialAdminUpdate(BaseModel):
    status: TestimonialStatus
    admin_comments: Optional[str] = None

class TestimonialResponse(TestimonialBase):
    id: uuid.UUID
    user_id: uuid.UUID
    status: TestimonialStatus
    admin_comments: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TestimonialFilter(BaseModel):
    employee_name: Optional[str] = None
    department: Optional[str] = None
    status: Optional[TestimonialStatus] = None