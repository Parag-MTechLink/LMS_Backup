from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class TRF(Base):
    __tablename__ = "trfs"

    id = Column(Integer, primary_key=True, index=True)
    trfNumber = Column(String, index=True, nullable=True)

    projectId = Column(Integer, nullable=False)
    projectName = Column(String, nullable=False)

    # Status lifecycle: Draft → Submitted → Approved / Rejected
    status = Column(String, nullable=False, default="Draft", server_default="Draft")

    # Test details
    test_type = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    sample_description = Column(Text, nullable=True)
    priority = Column(String, nullable=False, default="Normal", server_default="Normal")

    notes = Column(Text, nullable=True)

    # Approval
    approved_by = Column(String, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
