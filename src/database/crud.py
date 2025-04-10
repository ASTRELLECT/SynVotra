from sqlalchemy.orm import Session
from . import models, schemas
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate, is_admin=False):
    hashed_password = pwd_context.hash(user.password)
    db_user = models.User(username=user.username, password=hashed_password, is_admin=is_admin)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
