import uuid
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date

class AnnouncementResponse(BaseModel):
    id: uuid.UUID
    title: str
    content: Optional[str] = None
    author_id: Optional[uuid.UUID] = None
    is_pinned: bool = False
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AnnouncementListResponse(BaseModel):
    announcements: List[AnnouncementResponse]
    
class AnnouncementCreate(BaseModel):
    title: str
    content: Optional[str] = None
    author_id: Optional[uuid.UUID] = None
    is_pinned: Optional[bool] = False
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class AnnouncementAttribute(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    author_id: Optional[uuid.UUID] = None
    is_pinned: Optional[bool] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class AnnouncementRecipientResponse(BaseModel):
    id: uuid.UUID
    announcement_id: uuid.UUID
    user_id: uuid.UUID
    is_read: bool
    read_at: Optional[datetime] = None

    class Config:
        from_attributes = True 
        