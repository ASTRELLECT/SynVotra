import uuid
import logging
from typing import List, Optional
from sqlalchemy import or_
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import APIRouter, HTTPException, Depends, status, Query

from src.database import get_db
from src.database.models import Testimonial, User
from src.auth.auth import get_current_user
from src.pydantic_model.testimonials import (
    TestimonialCreate, 
    TestimonialUpdate, 
    TestimonialResponse, 
    TestimonialStatus,
    TestimonialListResponse
)

logger = logging.getLogger(__name__)

testimonials_router = APIRouter(
    prefix="/testimonials",
    tags=["Testimonials"]
)

@testimonials_router.get("/get-all", response_model=TestimonialListResponse)
async def get_testimonials(
    status: Optional[TestimonialStatus] = None,
    employee_id: Optional[str] = None,
    department: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get testimonials with optional filtering
    
    Regular users can only see approved testimonials.
    Admins can see all testimonials and filter by status.
    
    Requires: Valid JWT token
    """
    try:
        query = db.query(Testimonial)
        
        # Apply access control based on user type
        if not current_user.is_admin:
            query = query.filter(Testimonial.status == TestimonialStatus.APPROVED)
        elif status:
            query = query.filter(Testimonial.status == status)
            
        # Apply additional filters if provided
        if employee_id:
            query = query.join(User).filter(
                or_(
                    User.first_name.ilike(f"%{employee_id}%"),
                    User.last_name.ilike(f"%{employee_id}%")
                )
            )
        
        if department:
            query = query.join(User).filter(User.role.ilike(f"%{department}%"))
        
        testimonials = query.all()
        logger.info("✅ Testimonials retrieved successfully")
        return {"testimonials": testimonials}
    
    except Exception as e:
        logger.error(f"Unexpected error retrieving testimonials: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )
    
@testimonials_router.get("/{testimonial_id}", response_model=TestimonialResponse)
async def get_testimonial(
    testimonial_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific testimonial by ID
    
    Regular users can only view approved testimonials or their own testimonials.
    Admins can view any testimonial.
    
    Requires: Valid JWT token
    """
    try:
        testimonial = db.query(Testimonial).filter(Testimonial.id == testimonial_id).first()
        if not testimonial:
            logger.warning(f"404 - Testimonial with ID {testimonial_id} not found")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Testimonial not found")
        
        # Access control check
        if not current_user.is_admin and testimonial.user_id != current_user.id and testimonial.status != TestimonialStatus.APPROVED:
            logger.warning(f"403 - User {current_user.id} attempted to access testimonial {testimonial_id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions to access this testimonial"
            )
        return testimonial
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Unexpected error retrieving testimonial: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )

@testimonials_router.post("", status_code=status.HTTP_201_CREATED)
async def create_testimonial(
    testimonial: TestimonialCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit a new testimonial
    
    Requires: Valid JWT token
    """
    try:
        new_testimonial = Testimonial(
            id=uuid.uuid4(),
            user_id=current_user.id,
            content=testimonial.content,
            status=TestimonialStatus.PENDING,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        db.add(new_testimonial)
        db.commit()
        db.refresh(new_testimonial)
        logger.info("✅ Testimonial submitted successfully")
        return {"message": "Testimonial submitted successfully", "id": new_testimonial.id}
        
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not create testimonial due to database constraint"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error creating testimonial: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )

@testimonials_router.put("/{testimonial_id}", response_model=TestimonialResponse)
async def update_testimonial(
    testimonial_id: uuid.UUID,
    update_data: TestimonialUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a testimonial
    
    - Regular users can only update content of their own pending testimonials
    - Admins can update status and add comments to any testimonial
    
    Requires: Valid JWT token
    """
    try:
        db_testimonial = db.query(Testimonial).filter(Testimonial.id == testimonial_id).first()
        if not db_testimonial:
            logger.warning(f"404 - Testimonial with ID {testimonial_id} not found")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Testimonial not found")
        
        # Convert Pydantic model to dict, excluding None values
        update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
        
        # Admin flow
        if current_user.is_admin:
            # Admins can update any field
            pass
        # Regular user flow
        else:
            # Check if user owns the testimonial
            if db_testimonial.user_id != current_user.id:
                logger.warning(f"403 - User {current_user.id} attempted to update testimonial {testimonial_id}")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to update this testimonial"
                )
            
            # Regular users can only update pending testimonials
            if db_testimonial.status != TestimonialStatus.PENDING:
                logger.warning(f"400 - Cannot update testimonial with status {db_testimonial.status}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Only pending testimonials can be updated"
                )
            
            # Regular users can only update content
            if "status" in update_dict or "admin_comments" in update_dict:
                logger.warning(f"403 - User {current_user.id} attempted to update restricted fields")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Regular users can only update content"
                )
        
        # Apply updates
        for key, value in update_dict.items():
            setattr(db_testimonial, key, value)
        
        db_testimonial.updated_at = datetime.now()
        db.commit()
        db.refresh(db_testimonial)
        logger.info(f"✅ Testimonial {testimonial_id} updated successfully")
        return db_testimonial
        
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not update testimonial due to database constraint"
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        db.rollback()
        logger.error(f"Unexpected error updating testimonial: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )

@testimonials_router.delete("/{testimonial_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_testimonial(
    testimonial_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a testimonial
    
    Regular users can only delete their own pending testimonials.
    Admins can delete any testimonial.
    
    Requires: Valid JWT token
    """
    try:
        db_testimonial = db.query(Testimonial).filter(Testimonial.id == testimonial_id).first()
        if not db_testimonial:
            logger.warning(f"404 - Testimonial with ID {testimonial_id} not found")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Testimonial not found")
            
        # Access control check
        if not current_user.is_admin:
            if db_testimonial.user_id != current_user.id:
                logger.warning(f"403 - User {current_user.id} attempted to delete testimonial {testimonial_id}")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to delete this testimonial"
                )
            if db_testimonial.status != TestimonialStatus.PENDING:
                logger.warning(f"400 - Cannot delete testimonial with status {db_testimonial.status}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Only pending testimonials can be deleted"
                )
        
        db.delete(db_testimonial)
        db.commit()
        logger.info("✅ Testimonial deleted successfully")
        return None
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        db.rollback()
        logger.error(f"Unexpected error deleting testimonial: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )