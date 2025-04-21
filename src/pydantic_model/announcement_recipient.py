from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class AnnouncementRecipientResponse(BaseModel):
    id: UUID
    announcement_id: UUID
    user_id: UUID
    is_read: bool
    read_at: Optional[datetime] = None

    class Config:
        from_attributes = True  # For SQLAlchemy compatibility
        
        
class AnnouncementRecipientCreate(BaseModel):
    announcement_id: UUID
    user_id: UUID

class AnnouncementRecipientUpdate(BaseModel):
    is_read: Optional[bool] = None
    read_at: Optional[datetime] = None