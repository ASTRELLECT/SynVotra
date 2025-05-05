from fastapi import FastAPI, HTTPException, Request, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import logging
import os
import sys
import uuid
import uvicorn
from fastapi.responses import HTMLResponse, RedirectResponse

from src.routes import ACTIVE_ROUTES
from src.resources.constants import ASTRELLECT_API_VERSION
from src.database import models, engine, Base, SessionLocal
from src.database.models import User, UserRole
from src.resources.constants import STATIC_DIR, TEMPLATES_DIR
from src.utils.utils import get_password_hash


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

    @app.get("/", response_class=HTMLResponse)
    async def get_landing_page(request: Request):
        return templates.TemplateResponse("landing.html", {"request": request})

    # Add a generic dashboard route that redirects based on JWT claims
    @app.get("/dashboard", response_class=HTMLResponse)
    async def get_dashboard(request: Request):
        # Get the token from cookie or header
        token = request.cookies.get("access_token") or request.headers.get("Authorization")
        
        if not token and "Authorization" in request.headers:
            token = request.headers["Authorization"].split(" ")[1]
        
        # Default to employee dashboard if no token or can't decode
        redirect_url = "/employee/dashboard"
        
        if token:
            try:
                # Extract the payload without verification for role check
                # In a real app, you'd want proper verification here
                from jose import jwt
                payload = jwt.decode(token, options={"verify_signature": False})
                
                # Get role and redirect accordingly
                user_role = payload.get("role", "employee").lower()
                
                if user_role == "admin":
                    redirect_url = "/admin/dashboard"
                elif user_role == "manager":
                    redirect_url = "/manager/dashboard"
                # else default is already employee
                
            except Exception as e:
                # Log the error but don't expose it to the user
                print(f"Error decoding token: {e}")
        
        # Redirect to the appropriate dashboard
        return RedirectResponse(url=redirect_url)

    # Employee pages
    @app.get("/employee/dashboard", response_class=HTMLResponse)
    async def get_employee_dashboard(request: Request):
        return templates.TemplateResponse("employee/dashboard.html", {"request": request})

    @app.get("/employee/profile", response_class=HTMLResponse)
    async def get_employee_profile(request: Request):
        return templates.TemplateResponse("employee/profile.html", {"request": request})

    @app.get("/employee/info-hub", response_class=HTMLResponse)
    async def get_employee_info_hub(request: Request):
        return templates.TemplateResponse("employee/info-hub.html", {"request": request})

    @app.get("/employee/trutime", response_class=HTMLResponse)
    async def get_employee_trutime(request: Request):
        return templates.TemplateResponse("employee/trutime.html", {"request": request})

    @app.get("/employee/attendance", response_class=HTMLResponse)
    async def get_employee_attendance(request: Request):
        return templates.TemplateResponse("employee/attendance.html", {"request": request})

    @app.get("/employee/leave", response_class=HTMLResponse)
    async def get_employee_leave(request: Request):
        return templates.TemplateResponse("employee/leave.html", {"request": request})

    @app.get("/employee/referral", response_class=HTMLResponse)
    async def get_employee_referral(request: Request):
        return templates.TemplateResponse("employee/referral.html", {"request": request})

    @app.get("/employee/performance", response_class=HTMLResponse)
    async def get_employee_performance(request: Request):
        return templates.TemplateResponse("employee/performance.html", {"request": request})

    @app.get("/employee/calendar", response_class=HTMLResponse)
    async def get_employee_calendar(request: Request):
        return templates.TemplateResponse("employee/calendar.html", {"request": request})

    @app.get("/employee/support", response_class=HTMLResponse)
    async def get_employee_support(request: Request):
        return templates.TemplateResponse("employee/support.html", {"request": request})

    # Manager pages
    @app.get("/manager/dashboard", response_class=HTMLResponse)
    async def get_manager_dashboard(request: Request):
        return templates.TemplateResponse("manager/dashboard.html", {"request": request})

    # Admin pages
    @app.get("/admin/dashboard", response_class=HTMLResponse)
    async def get_admin_dashboard(request: Request):
        return templates.TemplateResponse("admin/dashboard.html", {"request": request})

    return app

if __name__ == "__main__":
    app = _get_app()
    uvicorn.run(app, host="0.0.0.0", port=8000)