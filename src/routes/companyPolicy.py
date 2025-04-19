from typing import List
import uuid
import logging
from fastapi import APIRouter, HTTPException, Depends, Response, status
from src.pydantic_model.companyPolicy import CompanyPolicyCreate, CompanyPolicyUpdate, AllCompanyPolicy
from src.database.models import CompanyPolicy, UserRole, User
from src.utils.utils import get_password_hash
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from src.database import get_db
from src.auth.auth import get_current_user, get_admin_user

logger = logging.getLogger(__name__)

policy_router = APIRouter(
    prefix="/policy",
    tags=["company policy"],
)

@policy_router.get("/getall", response_model=List[AllCompanyPolicy])
async def get_all_policy(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all company policies
    
    Requires: Valid JWT token
    """
    try:
        policy = db.query(CompanyPolicy).all()
        logger.info(f"Found {len(policy)} policies.")
        return policy
    except Exception as e:
        logger.error(f"Unexpected error retrieving users: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )

@policy_router.post("/create_new_policy", response_model=CompanyPolicyCreate, status_code=status.HTTP_201_CREATED)
async def create_policy(
    policy: CompanyPolicyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """
    Creates new company policies
    
    Requires: Valid JWT token
    """
    try:
        # Case-insensitive title check
        existing_policy = db.query(CompanyPolicy).filter(CompanyPolicy.title == policy.title).first()
        
        if existing_policy:
            logger.warning(f"Policy title conflict: {policy.title}")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Policy with this title already exists"
            )

        # Create new policy - only include valid fields
        policy_data = policy.model_dump()
        new_policy = CompanyPolicy(
            **policy_data,
            id=uuid.uuid4(),
            created_by=current_user.id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        db.add(new_policy)
        db.commit()
        db.refresh(new_policy)
        logger.info(f"Admin {current_user.id} created new Company Policy with title: {new_policy.title}")
        return new_policy

    except Exception as e:
        db.rollback()
        logger.error(f"Error creating policy: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create policy"
        )

@policy_router.put("/edit_policy/{policy_id}", response_model=CompanyPolicyUpdate)
async def update_policy(
    policy_id: uuid.UUID,
    policy_update: CompanyPolicyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """
    Update an existing company policy
    
    Requires:
    - Valid JWT token
    - Admin privileges
    """
    try:
        # Get existing policy
        db_policy = db.query(CompanyPolicy).filter(CompanyPolicy.id == policy_id).first()
        if not db_policy:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Policy not found"
            )

        if policy_update.title:
            existing_policy = db.query(CompanyPolicy).filter(
                CompanyPolicy.title == db_policy.title,
                CompanyPolicy.id != policy_id
                ).first()
            if existing_policy:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Policy with this title already exists"
                )

        # Update fields
        update_data = policy_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_policy, field, value)
        
        db_policy.updated_at = datetime.utcnow()
        logger.info(f"Admin {current_user.id} updated the Company Policy '{db_policy.title}'")
        db.commit()
        db.refresh(db_policy)
        logger.info(f"Admin {current_user.id} updated the Company Policy '{db_policy}'")
        return db_policy

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating policy: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update policy"
        )


@policy_router.delete("/delete_policy/{policy_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_policy(
    policy_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """
    Delete a company policy
    
    Requires:
    - Valid JWT token
    - Admin privileges
    """
    try:
        db_policy = db.query(CompanyPolicy).filter(CompanyPolicy.id == policy_id).first()
        if not db_policy:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Policy not found"
            )
        logger.info(f"Admin {current_user.id} created new Company Policy with title: {db_policy.title}")
        db.delete(db_policy)
        db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting policy: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete policy"
        )