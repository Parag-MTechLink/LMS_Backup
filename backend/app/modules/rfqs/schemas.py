from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID

class RFQBase(BaseModel):
    customerId: int
    product: str
    receivedDate: str
    status: str = "pending"

class RFQCreate(RFQBase):
    pass

class RFQUpdate(BaseModel):
    status: Optional[str] = None
    technical_manager_id: Optional[UUID] = None
    finance_manager_id: Optional[UUID] = None
    feasibility_notes: Optional[str] = None
    quotation_notes: Optional[str] = None

class RFQOut(RFQBase):
    id: int
    customerName: str
    
    class Config:
        from_attributes = True

class NoteRequest(BaseModel):
    notes: str
