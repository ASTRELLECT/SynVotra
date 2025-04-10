import uuid
import logging
from fastapi import APIRouter,  HTTPException, Depends
from src.pydantic_model.users import UserCreate, UserUpdate, UserResponse
from src.database.models import User

from sqlalchemy.orm import Session
from src.database import get_db


logger = logging.getLogger(__name__)

from src.database import SessionLocal, get_db

users_router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@users_router.get("/getall", response_model=UserResponse)
async def get_all_users(
    db: SessionLocal = Depends(get_db)
):
    """
    Get all users
    """
    pass

@users_router.post("/create", response_model=UserResponse)
async def create_user(
    user: UserCreate,
    db: SessionLocal = Depends(get_db)
):
    """
    Create a new user
    """
    pass
@users_router.put("/update/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    user: UserUpdate,
    db: SessionLocal = Depends(get_db)
):
    """
    Update a user
    """
    pass

@users_router.delete("/delete/{user_id}", response_model=UserResponse)
async def delete_user(
    user_id: uuid.UUID,
    db: SessionLocal = Depends(get_db)
):
    """
    Delete a user
    """
    pass

