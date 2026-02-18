"""Pydantic schemas for lab recommendation API."""
from pydantic import BaseModel, Field


class RecommendRequest(BaseModel):
    """Body for POST /api/v1/labs/recommend."""
    test_name: str = Field("", description="Test name filter")
    standard: str = Field("", description="Standard code filter")
    domain: str = Field("", description="Domain name filter")
    state: str = Field("", description="State filter (from locations)")
    city: str = Field("", description="City filter (from locations)")
    limit: int = Field(20, ge=1, le=100, description="Max results")


class LabSearchQuery(BaseModel):
    """Query params for GET /api/v1/labs/search."""
    test_name: str = ""
    standard: str = ""
    domain: str = ""
    limit: int = Field(50, ge=1, le=100)


class TestsSearchQuery(BaseModel):
    """Query params for GET /api/v1/labs/tests/search."""
    q: str = Field(..., min_length=1)
    limit: int = Field(20, ge=1, le=100)


class StandardsSearchQuery(BaseModel):
    """Query params for GET /api/v1/labs/standards/search."""
    q: str = Field(..., min_length=1)
    limit: int = Field(20, ge=1, le=100)
