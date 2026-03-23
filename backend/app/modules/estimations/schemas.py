from pydantic import BaseModel
from typing import List, Optional

class EstimationTestItemCreate(BaseModel):
    testTypeId: int
    numberOfDUT: int
    hours: float
    ratePerHour: float
    remarks: str | None = None

class EstimationTestItemOut(EstimationTestItemCreate):
    id: int
    estimationId: int

    class Config:
        from_attributes = True

class EstimationCreate(BaseModel):
    rfqId: int
    tests: List[EstimationTestItemCreate]
    margin: float
    discount: float
    notes: Optional[str] = None

class EstimationOut(BaseModel):
    id: int
    rfqId: int
    estimationId: str
    version: int
    totalCost: Optional[float] = 0.0
    totalHours: Optional[float] = 0.0
    margin: Optional[float] = 0.0
    discount: Optional[float] = 0.0
    notes: Optional[str] = None
    status: str
    items: List[EstimationTestItemOut] = []

    # Extra fields for UI convenience
    rfqCustomerName: Optional[str] = None
    rfqProduct: Optional[str] = None

    class Config:
        from_attributes = True

class EstimationReview(BaseModel):
    status: str  # approved, rejected
    comments: Optional[str] = None

class TestTypeOut(BaseModel):
    id: int
    name: str
    hsnCode: str
    defaultRate: float
