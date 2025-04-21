from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from src.database.models import Announcement, AnnouncementRecipient
from src.pydantic_model.announcement import AnnouncementAttribute, AnnouncementCreate,AnnouncementResponse, AnnouncementUpdate
from src.pydantic_model.announcement_recipient import AnnouncementRecipientCreate, AnnouncementRecipientResponse, AnnouncementRecipientUpdate
from src.database import get_db
from src.auth.auth import get_current_user, get_admin_user
from src.database.models import User, UserRole
import logging
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)

announcement_router = APIRouter(
    prefix="/announcement",
    tags=["announcement"]
)

from sqlalchemy.orm import Session

from src.database import get_db

@announcement_router.get("/get-all")
async def get_all_announcements(
    db: Session = Depends(get_db)
):
    """
    Get all announcements
    """
    
    announcements = db.query(Announcement).all()
    logger.info(f"Found {len(announcements)} users")
    return announcements


@announcement_router.get("/filter")
async def filter_announcement_by_attribute(
    attributes: AnnouncementAttribute = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)):
    
    """
    Get announcements filtered by any combination of attributes.
    Requires: Valid JWT token. All authenticated users can access.
    """
    try:
        query = db.query(Announcement)
        filters = []

        if attributes.title:
            filters.append(Announcement.title.ilike(f"%{attributes.title}%"))
        if attributes.content:
            filters.append(Announcement.content.ilike(f"%{attributes.content}%"))
        if attributes.author_id:
            filters.append(Announcement.author_id == attributes.author_id)
        if attributes.is_pinned is not None:
            filters.append(Announcement.is_pinned == attributes.is_pinned)
        if attributes.start_date:
            filters.append(Announcement.start_date >= attributes.start_date)
        if attributes.end_date:
            filters.append(Announcement.end_date <= attributes.end_date)

        logger.info(f"Filtering announcements with attributes: {attributes.json()}")
        if filters:
            query = query.filter(*filters)

        announcements = query.all()
        if not announcements:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No announcements found matching the provided criteria"
            )
        return announcements

    except Exception as e:
        logger.error(f"Unexpected error filtering announcements: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )


@announcement_router.post("/create")
async def create_Announcement(
    announcement: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)):
    
    """
    Create a new announcement.
    Automatically assigns all active employees as recipients.
    Allowed: Admins and Managers only.
    """
    try:
        if not current_user.is_admin :
            logger.warning(f"403 - User {current_user.id} attempted to filter users by attributes")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions to create an announcement"
            )
    except Exception as e:
        logger.error(f"Unexpected error checking user permissions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )
    try:
        # Create the Announcement
        new_announcement = Announcement(
            id=uuid.uuid4(),
            title=announcement.title,
            content=announcement.content,
            author_id=current_user.id,
            is_pinned=announcement.is_pinned,
            start_date=announcement.start_date,
            end_date=announcement.end_date,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )

        db.add(new_announcement)
        db.flush()  

        # Assign all active employees as recipients
        employees = db.query(User).filter(User.role == UserRole.EMPLOYEE, User.is_active == True).all()

        for employee in employees:
            recipient = AnnouncementRecipient(
                id=uuid.uuid4(),
                announcement_id=new_announcement.id,
                user_id=employee.id,
                is_read=False,
                read_at=None
            )
            db.add(recipient)
        db.commit()
        db.refresh(new_announcement)

        return new_announcement
    
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not create announcement due to database constraint"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error creating announcement: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )
        
@announcement_router.get("/get-recipient/{announcement_id}/{user_id}")
async def get_announcement_recipient(
    user_id: uuid.UUID,
    announcement_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    
    """
    Get the announcement recipient according to the user id and 
    announcement id 
    """
    recipient = db.query(AnnouncementRecipient).filter(
        AnnouncementRecipient.user_id == user_id,
        AnnouncementRecipient.announcement_id == announcement_id
    ).first()

    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipient not found for given user and announcement"
        )

    return recipient

@announcement_router.put("/mark-as-read")
async def mark_announcement_as_read(
    announcement_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark an announcement as read for the current user.
    """
    try:
        recipient = db.query(AnnouncementRecipient).filter(
            AnnouncementRecipient.announcement_id == announcement_id,
            AnnouncementRecipient.user_id == current_user.id
        ).first()

        if not recipient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No announcement corresponding to this user"
            )

        if recipient.is_read:
            return {"message": "Already marked as read"}

        recipient.is_read = True
        recipient.read_at = datetime.now()

        db.commit()
        db.refresh(recipient)

        return {"message": "Announcement marked as read"}

    except Exception as e:
        db.rollback()
        logger.error(f"Error marking announcement as read: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )

@announcement_router.delete("/delete/{announcement_id}")
async def delete_announcement(
    announcement_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)):
    
    """
    Delete an announcement and all its recipient entries.
    Allowed: Admins and Managers only.
    """
    
    try:
        if not current_user.is_admin :
            logger.warning(f"403 - User {current_user.id} attempted to filter users by attributes")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions to create an announcement"
            )
    except Exception as e:
        logger.error(f"Unexpected error checking user permissions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )
    try:
        announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()
        
        if not announcement:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Announcement not found"
            )
        
        # Delete recipient entries 
        db.query(AnnouncementRecipient).filter(
            AnnouncementRecipient.announcement_id == announcement_id
        ).delete()
        
        # Then delete the announcement
        db.delete(announcement)
        db.commit()

        return {"message": "Announcement and associated recipients deleted successfully"}

    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting announcement: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while deleting the announcement"
        )
        