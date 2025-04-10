from pydantic import BaseModel, root_validator, Field
from typing import Optional, List
from datetime import datetime


class PageBase(BaseModel):
    title: str
    content: str

    class Config:
        from_attributes  = True
        
class PageCreate(BaseModel):
    title: str
    content: str
    author_id: int
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    is_published: bool = False
class PageUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None    
    is_published: Optional[bool] = None
    updated_at: Optional[datetime] = Field(default_factory=datetime.now)


class PageResponse(BaseModel):
    id: int
    title: str
    content: str
    author_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes  = True