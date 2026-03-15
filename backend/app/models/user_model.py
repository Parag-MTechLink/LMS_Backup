"""
Authentication and RBAC models. New tables only; no changes to business tables.
"""
import uuid
from datetime import datetime

from sqlalchemy import Column, Text, Boolean, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.core.database import Base


# Allowed role values (stored as TEXT; no FK to avoid circular deps)
ROLES = ("Admin", "Lab Manager", "Sales Engineer", "Testing Engineer", "Technician")


class User(Base):
    """User account for authentication and RBAC."""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(Text, nullable=False)
    email = Column(Text, unique=True, nullable=False, index=True)
    password_hash = Column(Text, nullable=False)
    role = Column(Text, nullable=False)  # One of ROLES
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Password Reset Fields
    reset_token = Column(Text, nullable=True, index=True)
    reset_token_expires = Column(DateTime, nullable=True)

    # Multi-Factor Authentication Fields
    mfa_code = Column(Text, nullable=True, index=True)
    mfa_code_expires = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"


class AuditLog(Base):
    """Audit trail for sensitive actions."""
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    action = Column(Text, nullable=False, index=True)  # e.g. "user.create", "rfq.approve"
    resource_type = Column(Text, nullable=True)  # e.g. "rfq", "user", "test_result"
    resource_id = Column(Text, nullable=True)
    details = Column(JSONB, nullable=True)
    ip_address = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (Index("ix_audit_logs_created_at", "created_at"),)
