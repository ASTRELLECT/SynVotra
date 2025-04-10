from pydantic import BaseModel, root_validator, Field
from typing import Optional, List


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    is_admin: bool = False

    class Config:
        from_attributes  = True
        
class UserCreate(BaseModel):
    username: str
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    is_admin: Optional[bool] = None
    name: Optional[str] = None
    email: Optional[str] = None
    id: Optional[int] = None
    is_admin: Optional[bool] = None