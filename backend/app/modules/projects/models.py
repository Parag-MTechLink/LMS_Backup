"""
Database models for Projects and Customers
"""
import uuid
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class Customer(Base):
    """Customer model"""
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    phone = Column(String(50), nullable=True)
    contact_person = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    region = Column(String(50), nullable=True)
    status = Column(String(50), nullable=False, default="active")
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    projects = relationship("Project", back_populates="client", cascade="all, delete-orphan")


class Project(Base):
    """Project model"""
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(100), nullable=True, unique=True, index=True)
    client_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    client_name = Column(String(255), nullable=True)  # Denormalized for performance
    status = Column(String(50), nullable=False, default="pending_team_lead") # pending_team_lead, testing_in_progress, report_submitted, tl_reviewed, approved, payment_pending, completed
    
    # Multi-stage Approval
    quality_manager_approved = Column(Boolean, default=False, nullable=False)
    project_manager_approved = Column(Boolean, default=False, nullable=False)
    technical_manager_approved = Column(Boolean, default=False, nullable=False)
    payment_completed = Column(Boolean, default=False, nullable=False)
    
    # Execution Info
    team_lead_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    oem = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    client = relationship("Customer", back_populates="projects")


class ProjectActivity(Base):
    """Chronological workflow activities for projects"""
    __tablename__ = "project_activities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    process_step = Column(Text, nullable=False)
    action = Column(Text, nullable=False)
    user_name = Column(Text, nullable=False)
    user_role = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
