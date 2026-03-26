from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ReportResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    file_type: str
    file_path: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
