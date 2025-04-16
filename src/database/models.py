# Add these imports at the top if not already present
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base

class Role(Base):
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    created_at = Column(DateTime, default=datetime.now)
    
    users = relationship("User", back_populates="role")
    
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String)
    last_name = Column(String)
    role_id = Column(Integer, ForeignKey("roles.id"))
    contact_number = Column(String)
    dob = Column(DateTime)
    address = Column(String)
    profile_picture_url = Column(String)
    joining_date = Column(DateTime)
    reporting_manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    role = relationship("Role", back_populates="users")
    reporting_manager = relationship("User", remote_side=[id], backref="subordinates")
    
class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    token = Column(String, nullable=False)
    ip_address = Column(String)
    user_agent = Column(String)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    
    # Relationship
    user = relationship("User")

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    token = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    
    # Relationship
    user = relationship("User")

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    clock_in_time = Column(DateTime)
    clock_out_time = Column(DateTime)
    total_hours = Column(Float)
    status = Column(String)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationship
    user = relationship("User")