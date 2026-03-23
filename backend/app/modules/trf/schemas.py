from pydantic import BaseModel
from typing import Optional


class TRFCreate(BaseModel):
    trfNumber: Optional[str] = None
    projectId: int
    projectName: Optional[str] = None
    status: str = "Pending QA"
    notes: Optional[str] = None


class TRFResponse(TRFCreate):
    id: int

    model_config = {
        "from_attributes": True
    }
