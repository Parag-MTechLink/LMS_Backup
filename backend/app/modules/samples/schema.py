from pydantic import BaseModel
from typing import Optional

class SampleCreate(BaseModel):
    sampleNumber: str
    condition: str
    receivedDate: Optional[str] = None
    storageLocation: Optional[str] = None
    projectId: Optional[int] = None
    projectName: Optional[str] = None
    notes: Optional[str] = None
    quantity: Optional[int] = None
    testDetails: Optional[str] = None

class SampleResponse(SampleCreate):
    id: int

    class Config:
        from_attributes = True
