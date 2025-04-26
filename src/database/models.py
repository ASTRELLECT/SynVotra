from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Float, Text, Date, Enum
from sqlalchemy.orm import relationship
import enum
import uuid
from datetime import datetime
from .base import Base
from src.database import UUID

class UserRole(str, enum.Enum):
    EMPLOYEE = "employee"
    MANAGER = "manager"
    ADMIN = "admin"
    
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String)
    last_name = Column(String)
    role = Column(Enum(UserRole), default=UserRole.EMPLOYEE)
    contact_number = Column(String)
    dob = Column(DateTime)
    address = Column(String)
    profile_picture_url = Column(String)
    joining_date = Column(DateTime)
    reporting_manager_id = Column(UUID(), ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False) 
    last_login = Column(DateTime)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships 
    reporting_manager = relationship("User", remote_side=[id], backref="subordinates")
    leave_requests = relationship("LeaveRequest", foreign_keys="LeaveRequest.user_id", back_populates="user")
    leave_balances = relationship("LeaveBalance", back_populates="user")
    referrals = relationship("Referral", foreign_keys="Referral.referrer_id", back_populates="referrer")
    performance_ratings = relationship("PerformanceRating", foreign_keys="PerformanceRating.user_id", back_populates="user")
    organized_events = relationship("Event", foreign_keys="Event.organizer_id", back_populates="organizer")
    tickets = relationship("Ticket", foreign_keys="Ticket.user_id", back_populates="user")
    assigned_tickets = relationship("Ticket", foreign_keys="Ticket.assigned_to", back_populates="assignee")
    announcements = relationship("Announcement", back_populates="author")
    testimonials = relationship("Testimonial", back_populates="user")
    
class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(), ForeignKey("users.id"))
    token = Column(String, nullable=False)
    ip_address = Column(String)
    user_agent = Column(String)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    
    # Relationship
    user = relationship("User")

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(), ForeignKey("users.id"))
    token = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    
    # Relationship
    user = relationship("User")

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(), ForeignKey("users.id"))
    clock_in_time = Column(DateTime)
    clock_out_time = Column(DateTime)
    total_hours = Column(Float)
    status = Column(String)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationship
    user = relationship("User")

class ManualTimeEntry(Base):
    __tablename__ = "manual_time_entries"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(), ForeignKey("users.id"))
    date = Column(Date, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    reason = Column(Text)
    status = Column(String, default="Pending")
    manager_id = Column(UUID(), ForeignKey("users.id"))
    manager_comments = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    manager = relationship("User", foreign_keys=[manager_id])

class LeaveType(Base):
    __tablename__ = "leave_types"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(Text)
    max_days_per_year = Column(Integer)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    leave_requests = relationship("LeaveRequest", back_populates="leave_type")
    leave_balances = relationship("LeaveBalance", back_populates="leave_type")

class LeaveBalance(Base):
    __tablename__ = "leave_balances"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(), ForeignKey("users.id"))
    leave_type_id = Column(UUID(), ForeignKey("leave_types.id"))
    balance = Column(Float, nullable=False)
    year = Column(Integer, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="leave_balances")
    leave_type = relationship("LeaveType", back_populates="leave_balances")

class LeaveRequest(Base):
    __tablename__ = "leave_requests"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(), ForeignKey("users.id"))
    leave_type_id = Column(UUID(), ForeignKey("leave_types.id"))
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    reason = Column(Text)
    status = Column(String, default="Pending") 
    approver_id = Column(UUID(), ForeignKey("users.id"))
    approver_comments = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="leave_requests")
    leave_type = relationship("LeaveType", back_populates="leave_requests")
    approver = relationship("User", foreign_keys=[approver_id])

class JobPosition(Base):
    __tablename__ = "job_positions"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    department = Column(String)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    
    # Relationships
    referrals = relationship("Referral", back_populates="position")

class Referral(Base):
    __tablename__ = "referrals"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    referrer_id = Column(UUID(), ForeignKey("users.id"))
    candidate_name = Column(String, nullable=False)
    candidate_email = Column(String, nullable=False)
    candidate_phone = Column(String)
    position_id = Column(UUID(), ForeignKey("job_positions.id"))
    resume_url = Column(String)
    referral_note = Column(Text)
    status = Column(String, default="Submitted")
    admin_comments = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    referrer = relationship("User", foreign_keys=[referrer_id], back_populates="referrals")
    position = relationship("JobPosition", back_populates="referrals")

class PerformanceCycle(Base):
    __tablename__ = "performance_cycles"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String, default="Planning")
    created_at = Column(DateTime, default=datetime.now)
    
    # Relationships
    performance_ratings = relationship("PerformanceRating", back_populates="cycle")

class PerformanceRating(Base):
    __tablename__ = "performance_ratings"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(), ForeignKey("users.id"))
    cycle_id = Column(UUID(), ForeignKey("performance_cycles.id"))
    manager_id = Column(UUID(), ForeignKey("users.id"))
    rating_value = Column(Float)
    feedback = Column(Text)
    is_finalized = Column(Boolean, default=False)
    finalized_by = Column(UUID(), ForeignKey("users.id"))
    finalized_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="performance_ratings")
    cycle = relationship("PerformanceCycle", back_populates="performance_ratings")
    manager = relationship("User", foreign_keys=[manager_id])
    finalizer = relationship("User", foreign_keys=[finalized_by])

class EventType(Base):
    __tablename__ = "event_types"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    color_code = Column(String)
    
    # Relationships
    events = relationship("Event", back_populates="event_type")

class Event(Base):
    __tablename__ = "events"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    description = Column(Text)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    location = Column(String)
    organizer_id = Column(UUID(), ForeignKey("users.id"))
    type_id = Column(UUID(), ForeignKey("event_types.id"))
    is_recurring = Column(Boolean, default=False)
    recurrence_pattern = Column(String)
    is_company_wide = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    organizer = relationship("User", foreign_keys=[organizer_id], back_populates="organized_events")
    event_type = relationship("EventType", back_populates="events")
    attendees = relationship("EventAttendee", back_populates="event")

class EventAttendee(Base):
    __tablename__ = "event_attendees"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(), ForeignKey("events.id"))
    user_id = Column(UUID(), ForeignKey("users.id"))
    status = Column(String, default="Pending") 
    response_date = Column(DateTime)
    
    # Relationships
    event = relationship("Event", back_populates="attendees")
    user = relationship("User")

class Holiday(Base):
    __tablename__ = "holidays"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    date = Column(Date, nullable=False)
    description = Column(Text)
    is_recurring = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now)

class TicketCategory(Base):
    __tablename__ = "ticket_categories"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(Text)
    
    # Relationships
    tickets = relationship("Ticket", back_populates="category")

class Ticket(Base):
    __tablename__ = "tickets"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(), ForeignKey("users.id"))
    category_id = Column(UUID(), ForeignKey("ticket_categories.id"))
    title = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String, default="Open") 
    priority = Column(String, default="Medium")
    assigned_to = Column(UUID(), ForeignKey("users.id"))
    resolution_notes = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    closed_at = Column(DateTime)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="tickets")
    category = relationship("TicketCategory", back_populates="tickets")
    assignee = relationship("User", foreign_keys=[assigned_to], back_populates="assigned_tickets")

class Announcement(Base):
    __tablename__ = "announcements"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    content = Column(Text)
    author_id = Column(UUID(), ForeignKey("users.id"))
    is_pinned = Column(Boolean, default=False)
    start_date = Column(Date)
    end_date = Column(Date)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    author = relationship("User", back_populates="announcements")
    recipients = relationship("AnnouncementRecipient", back_populates="announcement")

class AnnouncementRecipient(Base):
    __tablename__ = "announcement_recipients"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    announcement_id = Column(UUID(), ForeignKey("announcements.id"))
    user_id = Column(UUID(), ForeignKey("users.id"))
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime)
    
    # Relationships
    announcement = relationship("Announcement", back_populates="recipients")
    user = relationship("User")

class CompanyPolicy(Base):
    __tablename__ = "company_policies"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    description = Column(Text)
    category = Column(String)
    document_url = Column(String)
    version = Column(String)
    is_active = Column(Boolean, default=True)
    created_by = Column(UUID(), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    creator = relationship("User")

class Testimonial(Base):
    __tablename__ = "testimonials"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(), ForeignKey("users.id"))
    content = Column(Text, nullable=False)
    status = Column(String, default="Pending")
    admin_comments = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    user = relationship("User", back_populates="testimonials")

class Avatar(Base):
    __tablename__ = "avatars"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    url = Column(String, nullable=False)  
