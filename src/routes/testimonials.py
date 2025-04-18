from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from src.pydantic_model.testimonials import TestimonialCreate, TestimonialUpdate, TestimonialResponse
from src.database.models import Testimonial
from src.database import get_db


testimonials_router = APIRouter(
    prefix="/testimonials",
    tags=["testimonials"]
)

from sqlalchemy.orm import Session

from src.database import get_db

@testimonials_router.get("/getall")
async def get_all_testimonials(
    db: Session = Depends(get_db)
):
    """
    Get all testimonials
    """
    pass