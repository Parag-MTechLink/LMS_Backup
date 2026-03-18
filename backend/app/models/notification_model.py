"""
Notification model for workflow-based in-app notifications.
"""
import uuid
from datetime import datetime

from sqlalchemy import Column, Text, Boolean, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class Notification(Base):
    """In-app notification for workflow step completions."""
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # The role that should receive this notification (e.g., "Project Manager")
    recipient_role = Column(Text, nullable=False, index=True)
    # Optional: specific user ID if targeted to one person
    recipient_user_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    title = Column(Text, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    # Entity context (so user can click to navigate)
    entity_type = Column(Text, nullable=True)   # e.g., "rfq", "project", "test_result"
    entity_id = Column(Text, nullable=True)      # UUID of the entity
    entity_url = Column(Text, nullable=True)     # Frontend route, e.g., "/lab/management/rfqs"
    # Who triggered this notification
    triggered_by_role = Column(Text, nullable=True)
    triggered_by_name = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_notifications_recipient_role_read", "recipient_role", "is_read"),
        Index("ix_notifications_created_at", "created_at"),
    )

    def __repr__(self):
        return f"<Notification(id={self.id}, role={self.recipient_role}, title={self.title[:30]})>"
