from sqlalchemy import Column, Integer, String, Date, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from app.core.database import Base


class RFQ(Base):
    __tablename__ = "rfqs"

    id = Column(Integer, primary_key=True, index=True)
    customerId = Column(Integer, ForeignKey("customers.id"), nullable=False)
    product = Column(String, nullable=False)
    receivedDate = Column(String, nullable=False)
    status = Column(String, default="pending")
    is_deleted = Column(Boolean, default=False, nullable=False)
    details = Column(JSONB, default={}, nullable=True)
    rfq_file_path = Column(String, nullable=True)
