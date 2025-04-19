from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from typing import Optional, Dict, Union
from jose import JWTError, jwt
from datetime import datetime, timedelta
from pydantic import BaseModel, ValidationError
from sqlalchemy.orm import Session

from src.resources.secret import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from src.resources.constants import ASTRELLECT_API_VERSION
from src.database import get_db
from src.database.models import User
from src.utils.utils import verify_password

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{ASTRELLECT_API_VERSION}/auth/token")

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    is_admin: Optional[bool] = None
    exp: Optional[datetime] = None

def create_access_token(data: dict, expires_delta: Union[timedelta, None] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def authenticate_user(db: Session, email: str, password: str):
    """Authenticate a user with email and password"""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    if not user.is_active:
        return False
    return user

async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
):
    """Get the current user from the token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(
            user_id=user_id,
            email=payload.get("email"),
            role=payload.get("role"),
            is_admin=payload.get("is_admin"),
            exp=datetime.fromtimestamp(payload.get("exp"))
        )
    except (JWTError, ValidationError):
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    """Get the current active user"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_admin_user(current_user: User = Depends(get_current_user)):
    """Get the current user if they are an admin"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

def verify_api_key(x_api_key: str = Header(..., description="API Key for system-to-system integration")):
    """Verify API key for system-to-system authentication"""
    from src.resources.secret import SYSTEM_API_KEY
    if x_api_key != SYSTEM_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key"
        )
    return True