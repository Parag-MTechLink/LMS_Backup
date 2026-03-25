from pydantic import BaseModel
from typing import Optional, Dict, Any

class RFQCreate(BaseModel):
    customerId: int
    product: str
    receivedDate: str
    details: Optional[Dict[str, Any]] = {}

class RFQOut(RFQCreate):
    id: int
    customerName: str
    status: str

    class Config:
        from_attributes = True
