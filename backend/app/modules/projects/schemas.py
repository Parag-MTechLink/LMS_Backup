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
    status: str = "pending"
    priority: str = "Medium"
    start_date: Optional[datetime] = Field(None, alias="startDate")
    end_date: Optional[datetime] = Field(None, alias="endDate")
    progress: int = 0
    manager_id: Optional[UUID] = Field(None, alias="managerId")
    manager_name: Optional[str] = Field(None, alias="managerName")
    oem: Optional[str] = None
    description: Optional[str] = None


class ProjectCreate(ProjectBase):
    """Schema for creating a project"""
    pass


class ProjectUpdate(BaseModel):
    """Schema for updating a project"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    code: Optional[str] = None
    client_id: Optional[int] = Field(None, alias="clientId")
    status: Optional[str] = None
    priority: Optional[str] = None
    start_date: Optional[datetime] = Field(None, alias="startDate")
    end_date: Optional[datetime] = Field(None, alias="endDate")
    progress: Optional[int] = None
    manager_id: Optional[UUID] = Field(None, alias="managerId")
    oem: Optional[str] = None
    description: Optional[str] = None


class ProjectResponse(BaseModel):
    """Schema for project response"""
    id: int
    name: str
    code: Optional[str] = None
    client_id: int = Field(..., alias="clientId")
    client_name: Optional[str] = Field(None, alias="clientName")
    status: str
    priority: str
    start_date: Optional[datetime] = Field(None, alias="startDate")
    end_date: Optional[datetime] = Field(None, alias="endDate")
    progress: int
    manager_id: Optional[UUID] = Field(None, alias="managerId")
    manager_name: Optional[str] = Field(None, alias="managerName")
    oem: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")
    is_deleted: bool = Field(..., alias="isDeleted")

    class Config:
        from_attributes = True
        populate_by_name = True
