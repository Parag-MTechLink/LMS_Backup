from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class EstimationTestItemCreate(BaseModel):
    testTypeId: int
    numberOfDUT: int
    hours: float
    ratePerHour: float
    remarks: str | None = None

class EstimationTestItemOut(EstimationTestItemCreate):
    id: int
    estimationId: int
    testTypeName: Optional[str] = None

    class Config:
        from_attributes = True

class EstimationCreate(BaseModel):
    rfqId: int
    tests: List[EstimationTestItemCreate]
    margin: float
    discount: float
    notes: str | None = None
    details: Optional[Dict[str, Any]] = {}

class EstimationOut(BaseModel):
    id: int
    rfqId: int
    estimationId: str
    version: int
    totalCost: float
    totalHours: float
    subtotal: float = 0
    margin: float
    discount: float
    notes: Optional[str] = None
    details: Optional[Dict[str, Any]] = {}
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
    parentId: Optional[int] = None
    hsnCode: Optional[str] = None
    defaultRate: float
    unit: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class TestTypeHierarchy(TestTypeOut):
    children: List["TestTypeHierarchy"] = []

TestTypeHierarchy.model_rebuild()
