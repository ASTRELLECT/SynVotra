from typing import List, Optional
import uuid
import logging
from fastapi import APIRouter, HTTPException, Depends, status, Query
from src.pydantic_model.testimonials import (
    TestimonialCreate, 
    TestimonialUpdate, 
    TestimonialResponse, 
    TestimonialAdminUpdate,
    TestimonialStatus,
    TestimonialFilter
)
from src.database.models import Testimonial, User, UserRole
from src.auth.auth import get_current_user, get_admin_user
from sqlalchemy.orm import Session
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from src.database import get_db

logger = logging.getLogger(__name__)

testimonials_router = APIRouter(
    prefix="/testimonials",
    tags=["Testimonials"]
)

@testimonials_router.get("/", response_model=List[TestimonialResponse])
async def get_all_testimonials(
    filters: TestimonialFilter = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all testimonials with optional filtering
    
    Regular users can only see approved testimonials.
    Admins can see all testimonials.
    
    Requires: Valid JWT token
    """
    try:
        query = db.query(Testimonial)
        
        # Regular users can only see approved testimonials
        if not current_user.is_admin:
            query = query.filter(Testimonial.status == TestimonialStatus.APPROVED)
        elif filters.status:
            # Admins can filter by status
            query = query.filter(Testimonial.status == filters.status)
        
        # Apply search filters if provided
        if filters.employee_name:
            query = query.join(User).filter(
                or_(
                    User.first_name.ilike(f"%{filters.employee_name}%"),
                    User.last_name.ilike(f"%{filters.employee_name}%")
                )
            )
        
        if filters.department:
            query = query.join(User).filter(User.role.ilike(f"%{filters.department}%"))
        
        testimonials = query.all()
        logger.info(f"Found {len(testimonials)} testimonials matching criteria")
        return testimonials
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
        
        # Check permissions
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


@testimonials_router.post("/submit", response_model=TestimonialResponse, status_code=status.HTTP_201_CREATED)
async def submit_testimonial(
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
        
        logger.info(f"User {current_user.id} created new testimonial with ID: {new_testimonial.id}")
        return new_testimonial
        
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


@testimonials_router.put("/update/{testimonial_id}", response_model=TestimonialResponse)
async def update_testimonial(
    testimonial_id: uuid.UUID,
    testimonial_update: TestimonialUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a testimonial
    
    Regular users can only update their own pending testimonials.
    Admins can update any testimonial.
    
    Requires: Valid JWT token
    """
    try:
        # Find testimonial
        db_testimonial = db.query(Testimonial).filter(Testimonial.id == testimonial_id).first()
        if not db_testimonial:
            logger.warning(f"404 - Testimonial with ID {testimonial_id} not found")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Testimonial not found")
        
        # Check permissions
        if not current_user.is_admin:
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
        
        update_data = testimonial_update.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.now()
        
        for key, value in update_data.items():
            setattr(db_testimonial, key, value)
        
        db.commit()
        db.refresh(db_testimonial)
        
        logger.info(f"User {current_user.id} updated testimonial with ID: {testimonial_id}")
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


@testimonials_router.delete("/delete/{testimonial_id}", status_code=status.HTTP_204_NO_CONTENT)
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
        
        # Check permissions
        if not current_user.is_admin:
            if db_testimonial.user_id != current_user.id:
                logger.warning(f"403 - User {current_user.id} attempted to delete testimonial {testimonial_id}")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to delete this testimonial"
                )
            # Regular users can only delete pending testimonials
            if db_testimonial.status != TestimonialStatus.PENDING:
                logger.warning(f"400 - Cannot delete testimonial with status {db_testimonial.status}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Only pending testimonials can be deleted"
                )
        
        db.delete(db_testimonial)
        db.commit()
        
        logger.info(f"User {current_user.id} deleted testimonial with ID: {testimonial_id}")
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


# Admin routes for testimonial approval/rejection
@testimonials_router.get("/admin/pending", response_model=List[TestimonialResponse])
async def get_pending_testimonials(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """
    Get all pending testimonials for admin review
    
    Requires: Valid JWT token with admin privileges
    """
    try:
        testimonials = db.query(Testimonial).filter(Testimonial.status == TestimonialStatus.PENDING).all()
        logger.info(f"Admin {current_user.id} retrieved {len(testimonials)} pending testimonials")
        return testimonials
    except Exception as e:
        logger.error(f"Unexpected error retrieving pending testimonials: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )


@testimonials_router.put("/admin/review/{testimonial_id}", response_model=TestimonialResponse)
async def review_testimonial(
    testimonial_id: uuid.UUID,
    admin_update: TestimonialAdminUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """
    Review (approve/reject) a testimonial
    
    Requires: Valid JWT token with admin privileges
    """
    try:
        db_testimonial = db.query(Testimonial).filter(Testimonial.id == testimonial_id).first()
        if not db_testimonial:
            logger.warning(f"404 - Testimonial with ID {testimonial_id} not found")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Testimonial not found")
        
        db_testimonial.status = admin_update.status
        db_testimonial.admin_comments = admin_update.admin_comments
        db_testimonial.updated_at = datetime.now()
        
        db.commit()
        db.refresh(db_testimonial)
        
        logger.info(f"Admin {current_user.id} updated testimonial status to {admin_update.status} for ID: {testimonial_id}")
        
        # Here you would add logic to notify the employee if the testimonial is rejected
        if admin_update.status == TestimonialStatus.REJECTED:
            logger.info(f"Notification should be sent to user {db_testimonial.user_id} about testimonial rejection")
            # This would call a notification service
        
        return db_testimonial
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        db.rollback()
        logger.error(f"Unexpected error reviewing testimonial: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )