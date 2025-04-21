from pydantic import BaseModel, root_validator, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from src.database.models import CompanyPolicy
import uuid


class AllCompanyPolicy(BaseModel):
    id: uuid.UUID
    title: Optional[str]
    description: Optional[str]
    category: Optional[str]
    document_url: Optional[str]
    version: Optional[str]
    is_active: Optional[bool]
    
    class Config:
        from_attributes = True



class CompanyPolicyCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    document_url: Optional[str] = None
    version: Optional[str] = None
    is_active: Optional[bool] = True
    
    class Config:
        from_attributes = True

class CompanyPolicyUpdate(CompanyPolicyCreate):
    pass
    
    class Config:
        from_attributes = True