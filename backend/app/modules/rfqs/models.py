from sqlalchemy import Column, Integer, String, Date, ForeignKey, Boolean, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from app.core.database import Base


class RFQ(Base):
    __tablename__ = "rfqs"

    id = Column(Integer, primary_key=True, index=True)
    customerId = Column(Integer, ForeignKey("customers.id"), nullable=False)
    product = Column(String, nullable=False)
    receivedDate = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    # Traceability for Feasibility
    feasibility_done_by_name = Column(String(255), nullable=True)
    feasibility_done_by_role = Column(String(255), nullable=True)
    feasibility_done_at = Column(DateTime, nullable=True)
    
    # Traceability for Quotation
    quotation_done_by_name = Column(String(255), nullable=True)
    quotation_done_by_role = Column(String(255), nullable=True)
    quotation_done_at = Column(DateTime, nullable=True)

    status = Column(String, default="pending") # pending, feasibility_done, quotation_pending, quotation_review, sent_to_customer, negotiation, approved
    
    technical_manager_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    finance_manager_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    feasibility_notes = Column(Text, nullable=True)
    feasibility_attachment_url = Column(String, nullable=True)
    quotation_notes = Column(Text, nullable=True)
    quotation_attachment_url = Column(String, nullable=True)
    
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships are handled via backrefs usually, but let's keep it clean
