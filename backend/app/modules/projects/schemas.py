"""
Pydantic schemas for Projects and Customers
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from uuid import UUID


# Customer Schemas
class CustomerBase(BaseModel):
    """Base customer schema"""
    company_name: str = Field(..., min_length=1, max_length=255, alias="companyName")
    email: EmailStr
    phone: Optional[str] = None
    contact_person: Optional[str] = Field(None, alias="contactPerson")
    address: Optional[str] = None
    region: Optional[str] = None

    class Config:
        populate_by_name = True


class CustomerCreate(CustomerBase):
    """Schema for creating a customer"""
    pass


class CustomerUpdate(BaseModel):
    """Schema for updating a customer"""
    company_name: Optional[str] = Field(None, min_length=1, max_length=255, alias="companyName")
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    contact_person: Optional[str] = Field(None, alias="contactPerson")
    address: Optional[str] = None
    region: Optional[str] = None
    status: Optional[str] = None

    class Config:
        populate_by_name = True


class CustomerResponse(BaseModel):
    """Schema for customer response"""
    id: int
    company_name: str = Field(..., alias="companyName")
    email: str
    phone: Optional[str] = None
    contact_person: Optional[str] = Field(None, alias="contactPerson")
    address: Optional[str] = None
    region: Optional[str] = None
    status: str
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")
    is_deleted: bool = Field(..., alias="isDeleted")

    class Config:
        from_attributes = True
        populate_by_name = True


# Project Schemas
class ProjectBase(BaseModel):
    """Base project schema"""
    name: str = Field(..., min_length=1, max_length=255)
    code: Optional[str] = None
    client_id: int = Field(..., alias="clientId")
    status: str = "pending_team_lead"
    oem: Optional[str] = None
    description: Optional[str] = None
    
    # Approval fields
    quality_manager_approved: bool = False
    project_manager_approved: bool = False
    technical_manager_approved: bool = False
    payment_completed: bool = False
    team_lead_id: Optional[UUID] = None


class ProjectCreate(ProjectBase):
    """Schema for creating a project"""
    pass


class ProjectUpdate(BaseModel):
    """Schema for updating a project"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    code: Optional[str] = None
    client_id: Optional[int] = Field(None, alias="clientId")
    status: Optional[str] = None
    oem: Optional[str] = None
    description: Optional[str] = None
    
    quality_manager_approved: Optional[bool] = None
    project_manager_approved: Optional[bool] = None
    technical_manager_approved: Optional[bool] = None
    payment_completed: Optional[bool] = None
    team_lead_id: Optional[UUID] = None


class ProjectResponse(BaseModel):
    """Schema for project response"""
    id: int
    name: str
    code: Optional[str] = None
    client_id: int = Field(..., alias="clientId")
    client_name: Optional[str] = Field(None, alias="clientName")
    status: str
    oem: Optional[str] = None
    description: Optional[str] = None
    
    quality_manager_approved: bool = Field(..., alias="qualityManagerApproved")
    project_manager_approved: bool = Field(..., alias="projectManagerApproved")
    technical_manager_approved: bool = Field(..., alias="technicalManagerApproved")
    payment_completed: bool = Field(..., alias="paymentCompleted")
    team_lead_id: Optional[UUID] = Field(None, alias="teamLeadId")
    team_lead_name: Optional[str] = Field(None, alias="teamLeadName")
    pending_approvals: List[str] = Field(default=[], alias="pendingApprovals")
    
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")
    is_deleted: bool = Field(..., alias="isDeleted")

    class Config:
        from_attributes = True
        populate_by_name = True


class ProjectActivityResponse(BaseModel):
    """Schema for project activity response"""
    id: UUID
    project_id: int = Field(..., alias="projectId")
    process_step: str = Field(..., alias="processStep")
    action: str
    user_name: str = Field(..., alias="userName")
    user_role: str = Field(..., alias="userRole")
    timestamp: datetime

    class Config:
        from_attributes = True
        populate_by_name = True
