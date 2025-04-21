import uuid
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import APIRouter, HTTPException, Depends, Response, status

from src.pydantic_model.companyPolicy import (
    CompanyPolicyCreate, 
    CompanyPolicyUpdate, 
    AllCompanyPolicyResponseList
)
from src.database import get_db
from src.database.models import CompanyPolicy, User
from src.auth.auth import get_current_user, get_admin_user

logger = logging.getLogger(__name__)

policy_router = APIRouter(
    prefix="/policy",
    tags=["Company policy"],
)

@policy_router.get("/getall", response_model=AllCompanyPolicyResponseList)
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
        if not policy:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No company policies found"
            )
        logger.info("Company policies retrieved successfully")
        return AllCompanyPolicyResponseList(company_policies=policy)
    except Exception as e:
        logger.error(f"Unexpected error retrieving users: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )

@policy_router.post("/create_new_policy",status_code=status.HTTP_201_CREATED)
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
        existing_policy = db.query(CompanyPolicy).filter(CompanyPolicy.title == policy.title).first()
        if existing_policy:
            logger.warning(f"Policy title conflict: {policy.title}")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Policy with this title already exists"
            )

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
        logger.info("✅ Company policy created successfully")
        return {"message": "Company policy created successfully", "id": new_policy.id}

    except Exception as e:
        db.rollback()
        logger.error(f"Error creating policy: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create policy"
        )

@policy_router.put("/edit_policy/{policy_id}")
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

        update_data = policy_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_policy, field, value)
        
        db_policy.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_policy)
        logger.info("✅ Company policy updated successfully")
        return {"message": "Company policy updated successfully"}
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
        db.delete(db_policy)
        db.commit()
        logger.info("✅ Company policy deleted successfully")
        return {"message": "Company policy deleted successfully"}
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting policy: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete policy"
        )