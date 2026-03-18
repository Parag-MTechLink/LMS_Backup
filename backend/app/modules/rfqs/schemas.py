from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class RFQBase(BaseModel):
    customerId: int
    product: str
    receivedDate: str
    description: Optional[str] = None
    status: str = "pending"

class RFQCreate(RFQBase):
    pass

class RFQUpdate(BaseModel):
    status: Optional[str] = None
    technical_manager_id: Optional[UUID] = None
    finance_manager_id: Optional[UUID] = None
    description: Optional[str] = None
    
    # Traceability
    feasibility_done_by_name: Optional[str] = None
    feasibility_done_by_role: Optional[str] = None
    feasibility_done_at: Optional[datetime] = None
    
    quotation_done_by_name: Optional[str] = None
    quotation_done_by_role: Optional[str] = None
    quotation_done_at: Optional[datetime] = None

    feasibility_attachment_url: Optional[str] = None
    quotation_notes: Optional[str] = None

class RFQOut(RFQBase):
    id: int
    customerName: str
    
    class Config:
        from_attributes = True

class NoteRequest(BaseModel):
    notes: str
