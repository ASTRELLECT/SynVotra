import uuid
import logging
from typing import List
from fastapi import APIRouter,  HTTPException, Depends
from src.pydantic_model.users import UserCreate, UserUpdate, UserResponse
from src.database.models import User
from src.database.models import UserRole

from sqlalchemy.orm import Session
from src.database import get_db


logger = logging.getLogger(__name__)

from src.database import SessionLocal, get_db

admin_router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


@admin_router.get("/get-user-by-role/{role}", response_model=List[UserResponse])
async def get_all_users(role,
    db: SessionLocal = Depends(get_db),
    
):
    """
    Get users according to their roles
    """
    
    if role == "employee":
        
        users = db.query(User).filter(User.role== UserRole.EMPLOYEE).all()
        
    if role =="manager":
        users = db.query(User).filter(User.role== UserRole.MANAGER).all()
        
    if role == "admin":
        users = db.query(User).filter(User.role== UserRole.ADMIN).all()
        
    
    logger.info(f"Found {len(users)} users")
    if not users:
        logger.warning(f"404 - No users found {users}")
        raise HTTPException(status_code=404, detail="No users found")

    return users

