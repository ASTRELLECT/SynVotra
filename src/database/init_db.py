from datetime import datetime
from sqlalchemy.orm import Session
import sys
import os
import uuid
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

from src.database import Base, engine, SessionLocal
from src.database.models import User, UserRole 
from src.utils.utils import get_password_hash

def init():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    admin_user = db.query(User).filter(User.email == "admin@astrellect.com").first()
    if not admin_user:
        new_user = User(
            id=uuid.uuid4(),
            first_name="Admin",
            email="admin@astrellect.com",
            hashed_password=get_password_hash("Admin@123#"),
            role=UserRole.ADMIN,
            contact_number="1234567890",
            dob=datetime.strptime("2000-01-01", "%Y-%m-%d"),
            address="123 Admin St, Admin City, Admin State, 12345",
            profile_picture_url="https://example.com/profile.jpg",
            joining_date=datetime.strptime("2023-01-01", "%Y-%m-%d"), 
            reporting_manager_id=None,
            is_active=True,
            is_admin=True,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            last_login=None,
        )
        db.add(new_user)
        db.commit()
        print("✅ Admin user created")
    else:
        print("✅ Admin user already exists")

if __name__ == "__main__":
    init()