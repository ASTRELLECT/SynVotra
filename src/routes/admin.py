from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from typing import Dict

from ..database import crud, models
from ..database.base import get_db
from ..auth.auth import get_current_active_user

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
)

templates = Jinja2Templates(directory="templates")

@router.get("/dashboard", response_class=HTMLResponse)
async def admin_dashboard(
    request: Request,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Admin dashboard page - only for admin users"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to access admin dashboard")
    
    return templates.TemplateResponse("admin/dashboard.html", {"request": request})

@router.get("/counts", response_model=Dict[str, int])
async def get_counts(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get counts for dashboard widgets - only for admin users"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to access admin data")
    
    # Get counts from database
    user_count = crud.get_user_count(db)
    announcement_count = crud.get_announcement_count(db)
    policy_count = crud.get_policy_count(db)
    testimonial_count = crud.get_testimonial_count(db)
    
    return {
        "users": user_count,
        "announcements": announcement_count,
        "policies": policy_count,
        "testimonials": testimonial_count
    }
