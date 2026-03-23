from pydantic import BaseModel

from typing import Optional

class RFQCreate(BaseModel):
    customerId: int
    customerName: Optional[str] = None
    product: str
    receivedDate: str

class RFQOut(BaseModel):
    id: int
    customerId: int
    customerName: Optional[str] = None
    product: str
    receivedDate: str
    status: str

    class Config:
        from_attributes = True
