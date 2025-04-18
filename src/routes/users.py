from typing import List
import uuid
import logging
from fastapi import APIRouter, HTTPException, Depends, status
from src.pydantic_model.users import UserCreate, UserUpdate, UserResponse
from src.database.models import User, UserRole
from src.utils.utils import get_password_hash
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from src.database import get_db
from src.auth.auth import get_current_user, get_admin_user

logger = logging.getLogger(__name__)

users_router = APIRouter(
    prefix="/employees",
    tags=["Users"]
)


@users_router.get("/getall", response_model=List[UserResponse])
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all users with pagination
    
    Requires: Valid JWT token
    """
    if not current_user.is_admin:
        return [current_user]
    
    users = db.query(User).offset(skip).limit(limit).all()
    logger.info(f"Found {len(users)} users")
    return users


@users_router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific user by ID
    Requires: Valid JWT token. Regular users can only get their own record.
    """
    if not current_user.is_admin and str(current_user.id) != str(user_id):
        logger.warning(f"403 - User {current_user.id} attempted to access user {user_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this record"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logger.warning(f"404 - User with ID {user_id} not found")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@users_router.post("/create", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """
    Create a new user
    
    Requires: Valid JWT token with admin privileges
    """
    try:
        existing_user = db.query(User).filter(User.email == user.email).first()
        if existing_user:
            logger.warning(f"409 - User with email {user.email} already exists")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with this email already exists"
            )
        
        hashed_password = get_password_hash(user.password)
        
        user_data = user.model_dump(exclude={"password"})
        
        new_user = User(
            id=uuid.uuid4(),
            hashed_password=hashed_password,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            **user_data
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        logger.info(f"Admin {current_user.id} created new user with ID: {new_user.id}")
        return new_user
        
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not create user due to database constraint"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error creating user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )


@users_router.put("/update/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a user's information
    
    Requires: Valid JWT token. Regular users can only update their own record.
    Admins can update any record.
    """
    if not current_user.is_admin and str(current_user.id) != str(user_id):
        logger.warning(f"403 - User {current_user.id} attempted to update user {user_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to update this record"
        )
    
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        logger.warning(f"404 - User with ID {user_id} not found")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    try:
        update_data = user_update.model_dump(exclude_unset=True)
        
        if not current_user.is_admin and "is_admin" in update_data:
            del update_data["is_admin"]
        
        if "password" in update_data:
            hashed_password = get_password_hash(update_data["password"])
            update_data["hashed_password"] = hashed_password
            del update_data["password"]
        
        update_data["updated_at"] = datetime.now()
        
        for key, value in update_data.items():
            setattr(db_user, key, value)
        
        db.commit()
        db.refresh(db_user)
        
        logger.info(f"User {current_user.id} updated user with ID: {user_id}")
        return db_user
        
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not update user due to database constraint"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error updating user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )


@users_router.delete("/delete/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """
    Delete a user (or mark as inactive)
    
    Requires: Valid JWT token with admin privileges
    """
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        logger.warning(f"404 - User with ID {user_id} not found")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    if db_user.is_admin:
        admin_count = db.query(User).filter(User.is_admin == True, User.is_active == True).count()
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete the last admin user"
            )
    
    try:
        # Option 1: Soft delete (recommended for production systems)
        db_user.is_active = False
        db_user.updated_at = datetime.now()
        
        # Option 2: Hard delete (uncomment if you really want to remove the record)
        # db.delete(db_user)
        
        db.commit()
        logger.info(f"Admin {current_user.id} deactivated user with ID: {user_id}")
        return None
        
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error deleting user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )
