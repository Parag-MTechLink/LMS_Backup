from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class DocumentBase(BaseModel):
    name: str
    description: Optional[str] = None
    type: str


class DocumentResponse(DocumentBase):
    id: int
    file_type: str
    file_path: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
