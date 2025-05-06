from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import jwt
import logging

from src.database import get_db
from src.auth.auth import Token, authenticate_user, create_access_token, get_current_user
from src.resources.secret import ACCESS_TOKEN_EXPIRE_MINUTES
from src.database.models import User
from src.utils.utils import get_password_hash, verify_password

auth_router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

logger = logging.getLogger(__name__)

@auth_router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user.last_login = datetime.now()
    db.commit()
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Include role in token data
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.value if user.role else None,
        "is_admin": user.is_admin
    }
    
    access_token = create_access_token(
        data=token_data, 
        expires_delta=access_token_expires
    )
    
    logger.info(f"User {user.email} logged in successfully")
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_id": str(user.id),
        "role": user.role.value if user.role else None
    }

@auth_router.post("/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    old_password: str = Body(...),
    new_password: str = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change user password
    """
    if not verify_password(old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password"
        )
    
    current_user.hashed_password = get_password_hash(new_password)
    db.commit()
    
    return {"detail": "Password updated successfully"}