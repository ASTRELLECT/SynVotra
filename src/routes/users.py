import uuid
import logging
from typing import List
from sqlalchemy.orm import Session
from datetime import datetime
from sqlalchemy.exc import IntegrityError
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse

from src.database import get_db
from src.database.models import User
from src.utils.utils import get_password_hash
from src.auth.auth import get_current_user, get_admin_user
from src.pydantic_model.users import (
    UserCreate, 
    UserUpdate, 
    UserResponse, 
    UserListResponse,
    UserAttribute, 
    AvatarType, 
    AvatarUpdate
)

logger = logging.getLogger(__name__)

users_router = APIRouter(
    prefix="/employees",
    tags=["Employees"]
)

@users_router.get("/get-me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

@users_router.get("/getall", response_model=UserListResponse)
async def get_all_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        if not current_user.is_admin:
            logger.info(f"ℹ️ Returning current user details for non-admin {current_user.id}")
            return UserListResponse(result=[current_user])
        users = db.query(User).all()
        logger.info("✅ Users retrieved successfully")
        return UserListResponse(result=users)
    except Exception as e:
        logger.error(f"❌ Unexpected error retrieving users: {str(e)}")
        return JSONResponse(status_code=500, content={"detail": "An unexpected error occurred while fetching users."})

@users_router.get("/filter", response_model=UserListResponse)
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
            logger.warning(f"🚫 403 - User {current_user.id} tried filtering users.")
            return JSONResponse(status_code=403, content={"detail": "Not enough permissions to filter users."})
    except Exception as e:
        logger.error(f"❌ Error checking permissions: {str(e)}")
        return JSONResponse(status_code=500, content={"detail": "An unexpected error occurred while filtering users."})

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

        logger.info(f"ℹ️ Filtering users with: {attributes.json()}")
        if filters:
            query = query.filter(*filters)

        users = query.all()
        if not users:
            logger.warning("⚠️ No users found matching criteria.")
            return JSONResponse(status_code=404, content={"detail": "No users found matching the provided criteria."})

        logger.info(f"✅ Retrieved filtered users")
        return UserListResponse(result=users)

    except Exception as e:
        logger.error(f"❌ Error filtering users: {str(e)}")
        return JSONResponse(status_code=500, content={"detail": "An unexpected error occurred while filtering users."})

@users_router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            logger.warning(f"⚠️ User with ID {user_id} not found")
            return JSONResponse(status_code=404, content={"detail": "User not found."})
        logger.info(f"✅ User {user_id} retrieved")
        return user

    except Exception as e:
        logger.error(f"❌ Error retrieving user: {str(e)}")
        return JSONResponse(status_code=500, content={"detail": "An unexpected error occurred while fetching user data."})

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
            return JSONResponse(
                status_code=status.HTTP_409_CONFLICT,
                content="User with this email already exists"
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
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content="Could not create user due to database constraint"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error creating user: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content="An unexpected error occurred"
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
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content="Not enough permissions to update this record"
            )

        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            logger.warning(f"404 - User with ID {user_id} not found")
            return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content="User not found")
    except Exception as e:
        logger.error(f"Unexpected error checking user permissions: {str(e)}")
        return JSONResponse(
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
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content="Could not update user due to database constraint"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error updating user: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content="An unexpected error occurred"
        )

@users_router.put("/update_profile_picture")
async def update_profile_picture(
    avatar_update: AvatarUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a user's profile picture by selecting one of the predefined avatars
    """
    try:
        user_id = current_user.id
        db_user = db.query(User).filter(User.id == user_id).first()
        db_user.profile_picture_url = avatar_update.avatar_type.value
        db_user.updated_at = datetime.now()
        db.commit()
        db.refresh(db_user)
        logger.info(f"User {current_user.id} updated profile picture for user with ID: {user_id}")
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"detail": "Profile picture updated successfully"}
        )

    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error updating profile picture: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "An unexpected error occurred while updating profile picture."}
        )

@users_router.delete("/delete/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    try:
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            logger.warning(f"⚠️ User {user_id} not found")
            return JSONResponse(status_code=404, content={"detail": "User not found"})
        if db_user.is_admin:
            admin_count = db.query(User).filter(User.is_admin == True, User.is_active == True).count()
            if admin_count <= 1:
                logger.warning(f"🚫 Attempted to delete last admin user")
                return JSONResponse(status_code=400, content={"detail": "Cannot delete the last admin user"})
    except Exception as e:
        logger.error(f"❌ Error checking permissions: {str(e)}")
        return JSONResponse(status_code=500, content={"detail": "An unexpected error occurred no enough permission."})
    try:
        db_user.is_active = False
        db_user.updated_at = datetime.now()
        db.commit()
        logger.info(f"✅ Admin {current_user.id} deactivated user with id {user_id}")
        return None
        
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error deleting user: {str(e)}")
        return JSONResponse(status_code=500, content={"detail": "An unexpected error occurred while deleting the user."})