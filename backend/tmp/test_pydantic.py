import json
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List

# Mock the schema structure
class ProjectResponse(BaseModel):
    id: int
    name: str
    status: str
    team_lead_id: Optional[UUID] = Field(None, alias="teamLeadId")
    team_lead_name: Optional[str] = Field(None, alias="teamLeadName")
    
    class Config:
        populate_by_name = True

# Mock the data
data = {
    "id": 29,
    "name": "Project 29",
    "status": "report_submitted",
    "team_lead_id": UUID("b4840736-7821-4fbc-a76f-ed34a56b5231"),
    "team_lead_name": "Tanishka"
}

# Serialize with aliases
p = ProjectResponse(**data)
json_out = p.model_dump_json(by_alias=True)
print(json_out)

# Serialize WITHOUT aliases (default in some cases)
json_no_alias = p.model_dump_json(by_alias=False)
print(json_no_alias)
