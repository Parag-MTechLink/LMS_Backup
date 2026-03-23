from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TRFCreate(BaseModel):
    trfNumber: Optional[str] = None
    projectId: int
    projectName: Optional[str] = None
<<<<<<< HEAD
    status: Optional[str] = "Draft"
    test_type: Optional[str] = None
    description: Optional[str] = None
    sample_description: Optional[str] = None
    priority: Optional[str] = "Normal"
=======
    status: str = "Pending QA"
>>>>>>> b18e4bd3a1ccd273b68bfd6c2f5920e21f7ef638
    notes: Optional[str] = None


class TRFStatusUpdate(BaseModel):
    status: str  # Draft | Submitted | Approved | Rejected
    approved_by: Optional[str] = None


class TRFResponse(TRFCreate):
    id: int
    approved_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True
    }
