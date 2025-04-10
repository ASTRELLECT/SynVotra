import logging 

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.database import get_db
from src.pydantic_model.pages import PageBase
from typing import List
from src.database import schemas, models


logger = logging.getLogger(__name__)


pages_router = APIRouter(
    prefix="/pages",
    tags=["Pages"]
)


@pages_router.get("/pages/", response_model=List[schemas.PageResponse])
def get_all_pages(db: Session = Depends(get_db)):
    pages = db.query(models.Page).all()
    return [schemas.PageResponse.from_orm(page) for page in pages]
