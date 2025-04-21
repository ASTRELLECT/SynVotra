from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
import uuid

# Base response model for Announcement
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

# Create model for new announcements
class AnnouncementCreate(BaseModel):
    title: str
    content: Optional[str] = None
    author_id: Optional[uuid.UUID] = None
    is_pinned: Optional[bool] = False
    start_date: Optional[date] = None
    end_date: Optional[date] = None

# Update model for modifying announcements
class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    author_id: Optional[uuid.UUID] = None
    is_pinned: Optional[bool] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

# Attribute model for filtering/partial operations
class AnnouncementAttribute(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    author_id: Optional[uuid.UUID] = None
    is_pinned: Optional[bool] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
