from pydantic import BaseModel

class RFQCreate(BaseModel):
    customerId: int
    product: str
    receivedDate: str

class RFQOut(RFQCreate):
    id: int
    customerName: str
    status: str

    class Config:
        from_attributes = True
