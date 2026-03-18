from pydantic import BaseModel
from datetime import date
from typing import Optional

class AuditCreate(BaseModel):
    auditNumber: str
    auditType: str
    title: str
    description: Optional[str] = None
    status: str
    auditDate: Optional[date] = None
    auditorName: Optional[str] = None

class AuditOut(AuditCreate):
    id: int

    class Config:
        from_attributes = True
