"""
RFQ request model for Excel-upload workflow.
Stores extracted and validated RFQ data from uploaded Excel files.
"""
import uuid
from datetime import datetime

from sqlalchemy import Column, Text, Date, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY

from app.core.database import Base


class RFQRequest(Base):
    """RFQ request from Excel upload; status workflow: Draft, Incomplete, Pending Review, Approved, Rejected."""
    __tablename__ = "rfq_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_name = Column(Text, nullable=True)
    contact_person = Column(Text, nullable=True)
    email = Column(Text, nullable=True)
    phone = Column(Text, nullable=True)
    project_type = Column(Text, nullable=True)
    sample_details = Column(JSONB, nullable=True)
    deadline = Column(Date, nullable=True)
    extracted_data = Column(JSONB, nullable=True)
    validation_status = Column(Text, nullable=True)
    missing_fields = Column(ARRAY(Text), nullable=True)
    status = Column(Text, nullable=False, default="Draft")
    assigned_to = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<RFQRequest(id={self.id}, company={self.company_name}, status={self.status})>"
