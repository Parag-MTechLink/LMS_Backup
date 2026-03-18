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
    status = Column(String, default="pending") # pending, feasibility_done, quotation_pending, quotation_review, sent_to_customer, negotiation, approved
    
    technical_manager_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    finance_manager_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    feasibility_notes = Column(Text, nullable=True)
    quotation_notes = Column(Text, nullable=True)
    
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships are handled via backrefs usually, but let's keep it clean
