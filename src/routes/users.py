from typing import List
import uuid
import logging
from fastapi import APIRouter, HTTPException, Depends, status
from src.pydantic_model.users import UserCreate, UserUpdate, UserResponse, UserAttribute
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all users with pagination
    
    Requires: Valid JWT token
    """
    try:
        if not current_user.is_admin:
            return [current_user]
        
        users = db.query(User).all()
        logger.info(f"Found {len(users)} users")
        return users
    except Exception as e:
        logger.error(f"Unexpected error retrieving users: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )


@users_router.get("/filter", response_model=List[UserResponse])
async def filter_users_by_attributes(
    attributes: UserAttribute = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get users filtered by any combination of attributes.
    Requires: Valid JWT token. Only admins can filter users.
    """
    try:
        if not current_user.is_admin:
            logger.warning(f"403 - User {current_user.id} attempted to filter users by attributes")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions to filter users"
            )
    except Exception as e:
        logger.error(f"Unexpected error checking user permissions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )
    try:
        query = db.query(User)
        filters = []
        if attributes.email:
            filters.append(User.email.ilike(f"%{attributes.email}%"))
        if attributes.first_name:
            filters.append(User.first_name.ilike(f"%{attributes.first_name}%"))
        if attributes.last_name:
            filters.append(User.last_name.ilike(f"%{attributes.last_name}%"))
        if attributes.role:
            filters.append(User.role == attributes.role)
        if attributes.contact_number:
            filters.append(User.contact_number.ilike(f"%{attributes.contact_number}%"))
        if attributes.dob:
            filters.append(User.dob == attributes.dob)
        if attributes.address:
            filters.append(User.address.ilike(f"%{attributes.address}%"))
        if attributes.joining_date:
            filters.append(User.joining_date == attributes.joining_date)
        if attributes.is_active is not None:
            filters.append(User.is_active == attributes.is_active)
        if attributes.is_admin is not None:
            filters.append(User.is_admin == attributes.is_admin)

        logger.info(f"Filtering users with attributes: {attributes.json()}")
        if filters:
            query = query.filter(*filters)

        users = query.all()
        if not users:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No users found matching the provided criteria"
            )
        return users

    except Exception as e:
        logger.error(f"Unexpected error filtering users: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )
        
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
    try:
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

    except Exception as e:
        logger.error(f"Unexpected error retrieving user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )
    
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
    try:
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
    except Exception as e:
        logger.error(f"Unexpected error checking user permissions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )
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
    try:
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
    except Exception as e:
        logger.error(f"Unexpected error checking user permissions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
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
