from sqlalchemy import Column, Integer, String, Date
from app.core.database import Base

class Audit(Base):
    __tablename__ = "audits_section"

    id = Column(Integer, primary_key=True, index=True)
    auditNumber = Column("audit_number", String, unique=True, index=True, nullable=False)
    auditType = Column("audit_type", String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(String, nullable=False, default="Scheduled")
    auditDate = Column("audit_date", Date, nullable=True)
    auditorName = Column("auditor_name", String, nullable=True)
