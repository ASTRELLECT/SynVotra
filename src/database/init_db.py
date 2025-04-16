from sqlalchemy.orm import Session
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

from src.database import Base, engine, SessionLocal
from src.database.models import User 
from src.database.utils import get_password_hash

def init():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    admin_user = db.query(User).filter(User.email == "admin@astrellect.com").first()
    if not admin_user:
        new_user = User(
            first_name="Admin",  # Changed from name to first_name
            email="admin@astrellect.com",
            hashed_password=get_password_hash("Amit@123#"),
            is_admin=True,
        )
        db.add(new_user)
        db.commit()
        print("✅ Admin user created")
    else:
        print("✅ Admin user already exists")

if __name__ == "__main__":
    init()