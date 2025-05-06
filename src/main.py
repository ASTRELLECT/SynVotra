from fastapi import FastAPI, HTTPException, Request, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from passlib.context import CryptContext
import logging
import os
import sys
import uuid
import uvicorn
from datetime import datetime, timedelta
from fastapi.responses import HTMLResponse, RedirectResponse
from typing import Optional

from src.routes import ACTIVE_ROUTES
from src.resources.constants import ASTRELLECT_API_VERSION
from src.database import models, engine, Base, SessionLocal
from src.database.models import User, UserRole
from src.resources.constants import STATIC_DIR, TEMPLATES_DIR
from src.resources.secret import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from src.resources.secret import SYSTEM_API_KEY
from src.utils.utils import get_password_hash

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def init_admin_user():
    """Initialize admin user if it doesn't exist"""
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.email == "admin@astrellect.com").first()
        if not admin_user:
            new_user = User(
                id=uuid.uuid4(),
                first_name="Admin",
                email="admin@astrellect.com",
                hashed_password=get_password_hash("Admin@123#"),
                role=UserRole.ADMIN,
                is_admin=True,
            )
            db.add(new_user)
            db.commit()

            logger.info("✅ Admin user created")
            new_employee = User(
                id=uuid.uuid4(),
                first_name="employee",
                email="employee@astrellect.com",
                hashed_password=get_password_hash("employee@123#"),
                role=UserRole.EMPLOYEE,
                is_admin=False,
            )
            db.add(new_employee)
            db.commit()
            logger.info("✅ Employee user created")
        else:
            logger.info("✅ Admin user already exists")
            logger.info("✅ Employee user already exists")
    except Exception as e:
        logger.error(f"Error creating admin user: {e}")
    finally:
        db.close()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Get current user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user is None:
            raise credentials_exception
        return user
    finally:
        db.close()

def _get_app():
    """Create and return a FastAPI app instance"""
    app = FastAPI(
        title="Astrellect API",
        description="API powered by Team Astrellect",
        version="1.0.0"
    )
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.mount("/static", StaticFiles(directory="static"), name="static")
    templates = Jinja2Templates(directory="templates")
    
    async def startup_event():
        try:
            models.Base.metadata.create_all(bind=engine)
            logger.info("✅ Database tables created successfully")
            init_admin_user()
        except Exception as e:
            logger.error(f"Error during startup: {e}")
            
    app.add_event_handler("startup", startup_event)
    app.add_event_handler("startup", lambda: logger.info("Starting up the FastAPI app..."))
    app.add_event_handler("shutdown", lambda: logger.info("Shutting down the FastAPI app..."))

    @app.on_event("startup")
    async def startup_event():
        try:
            models.Base.metadata.create_all(bind=engine)
            logger.info("✅ Database tables created successfully")
            init_admin_user()
        except Exception as e:
            logger.error(f"Error during startup: {e}")
    
    for route in ACTIVE_ROUTES.values():
        app.include_router(route, prefix=ASTRELLECT_API_VERSION)

    @app.get("/", response_class=HTMLResponse)
    async def get_landing_page(request: Request):
        return templates.TemplateResponse("landing.html", {"request": request})

    @app.get("/dashboard", response_class=HTMLResponse)
    async def get_dashboard(request: Request):
        try:
            # Try to get token from cookie first
            token = request.cookies.get("access_token")
            
            # Then try Authorization header
            if not token:
                auth_header = request.headers.get("Authorization")
                if auth_header and auth_header.startswith("Bearer "):
                    token = auth_header.split(" ")[1]
            
            if not token:
                logger.info("No authentication token found, redirecting to login page")
                return RedirectResponse(url="/", status_code=status.HTTP_303_SEE_OTHER)
            
            # Verify token with proper secret key
            try:
                payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                user_role = payload.get("role", "employee").lower()
                
                if user_role == "admin":
                    redirect_url = "/admin/dashboard"
                elif user_role == "manager":
                    redirect_url = "/manager/dashboard"
                else:
                    redirect_url = "/employee/dashboard"
                
                logger.info(f"User with role '{user_role}' redirected to {redirect_url}")
                return RedirectResponse(url=redirect_url, status_code=status.HTTP_303_SEE_OTHER)
                
            except JWTError as e:
                logger.error(f"JWT validation error: {str(e)}")
                # Clear invalid token
                response = RedirectResponse(url="/")
                response.delete_cookie("access_token")
                return response
                
        except Exception as e:
            logger.error(f"Unexpected error during token processing: {str(e)}")
            return RedirectResponse(url="/", status_code=status.HTTP_303_SEE_OTHER)
    
    # Dashboard routes for each role
    @app.get("/employee/dashboard", response_class=HTMLResponse)
    async def get_employee_dashboard(request: Request):
        return templates.TemplateResponse("dashboard_employee.html", {"request": request})
    
    @app.get("/admin/dashboard", response_class=HTMLResponse)
    async def get_admin_dashboard(request: Request):
        return templates.TemplateResponse("dashboard_admin.html", {"request": request})
    
    @app.get("/manager/dashboard", response_class=HTMLResponse)
    async def get_manager_dashboard(request: Request):
        return templates.TemplateResponse("dashboard_manager.html", {"request": request})
    
    # Profile and management routes
    @app.get("/profile", response_class=HTMLResponse)
    async def get_profile(request: Request):
        return templates.TemplateResponse("profile.html", {"request": request})
    
    @app.get("/user_management", response_class=HTMLResponse)
    async def get_user_management(request: Request):
        return templates.TemplateResponse("user_management.html", {"request": request})
    
    @app.get("/testimonials", response_class=HTMLResponse)
    async def get_testimonials(request: Request):
        return templates.TemplateResponse("testimonials.html", {"request": request})
    @app.get("/policies",response_class=HTMLResponse )
    async def get_testimonials(request: Request):
        return templates.TemplateResponse("policies.html", {"request": request})
    @app.get("/announcement", response_class=HTMLResponse)
    async def get_announcement(request: Request):
        return templates.TemplateResponse("announcement.html", {"request": request})

    return app

if __name__ == "__main__":
    app = _get_app()
    uvicorn.run(app, host="0.0.0.0", port=8000)