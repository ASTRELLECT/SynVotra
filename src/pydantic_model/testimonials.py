import uuid
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
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
    status: Optional[TestimonialStatus] = None
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

class TestimonialListResponse(BaseModel):
    testimonials: List[TestimonialResponse]