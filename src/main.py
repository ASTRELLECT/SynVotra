from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import logging
import os
import sys
import uuid
import uvicorn

from src.routes import ACTIVE_ROUTES
from src.resources.constants import ASTRELLECT_API_VERSION
from src.database import models, engine, Base, SessionLocal
from src.database.models import User, UserRole, Avatar
from src.resources.constants import  STATIC_DIR, TEMPLATES_DIR
from src.utils.utils import get_password_hash
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from src.resources.constants import AVATAR_1_URL, AVATAR_2_URL

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_seed_avatars(db: Session):
    # Check if avatars already exist
    if db.query(Avatar).count() == 0:
        # Add default avatars
        avatars = [
            Avatar(
                
                name="Avatar 1",
                url= AVATAR_1_URL
                
            ),
            Avatar(
                name="Avatar 2",
                url= AVATAR_2_URL
            ),
        ]
        db.add_all(avatars)
        db.commit()
        print("✅ Default avatars created")
    else:
        print("✅ Avatars already exist")

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
        # seed default existing avatars into the database    
        init_seed_avatars(db)
        logger.info("✅ Avatars seeded successfully")

    except Exception as e:
        logger.error(f"Error creating admin user: {e}")
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
    print(STATIC_DIR, TEMPLATES_DIR)
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

    @app.get("/")
    async def root(request: Request):
        return templates.TemplateResponse("login/login.html", {"request": request})
    
    @app.get("/policy")
    async def companyPolicy(request: Request):
        return templates.TemplateResponse("policy-documentation/policy.html", {"request": request})
    @app.get("/admin-view")
    async def adminView(request: Request):
        return templates.TemplateResponse("admin/admin-view.html", {"request": request})

    @app.get("/employee-dashboard",response_class=HTMLResponse)
    async def employeeDash(request:Request):
        return templates.TemplateResponse('employee-profile/dashboard.html',{'request':request})
    
    @app.get("/testimonial", response_class=HTMLResponse)
    async def testimonialDisplay(request: Request):
        return templates.TemplateResponse('testimonial/testimonial-display.html', {'request': request})

    return app

if __name__ == "__main__":
    app = _get_app()
    uvicorn.run(app, host="0.0.0.0", port=8000)