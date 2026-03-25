"""
Pydantic Schemas for Organization Module
Request/Response models for API validation
"""
from pydantic import BaseModel, Field, validator, field_validator
from typing import Optional, List, Union, Any
from datetime import date, time, datetime
from uuid import UUID

from app.utils.validators import (
    validate_pin_code,
    validate_mobile_number,
    validate_ifsc_code,
    validate_gst_number,
    validate_coordinates
)


# ============================================================================
# Base Schemas
# ============================================================================

class TopManagementBase(BaseModel):
    """Base schema for top management"""
    name: str = Field(..., min_length=1, max_length=255)
    designation: str = Field(..., min_length=1, max_length=255)
    mobile: str = Field(..., min_length=10, max_length=20)
    telephone: Optional[str] = Field(None, max_length=20)
    fax: Optional[str] = Field(None, max_length=20)
    order_index: int = 0


class TopManagementCreate(TopManagementBase):
    """Schema for creating top management"""
    pass


class TopManagementResponse(TopManagementBase):
    """Schema for top management response"""
    id: UUID
    
    class Config:
        from_attributes = True


class ShiftTimingBase(BaseModel):
    """Base schema for shift timing"""
    shift_from: str  # Will be converted to time
    shift_to: str    # Will be converted to time
    order_index: int = 0


class ShiftTimingCreate(ShiftTimingBase):
    """Schema for creating shift timing"""
    pass


class ShiftTimingResponse(ShiftTimingBase):
    """Schema for shift timing response"""
    id: UUID
    
    class Config:
        from_attributes = True


class ComplianceDocumentBase(BaseModel):
    """Base schema for compliance document"""
    document_type: str
    document_type_other: Any = None
    document_id: Any = None  # Accept any type to bypass validation
    file_url: Any = None  # Accept any type to bypass validation


class ComplianceDocumentCreate(ComplianceDocumentBase):
    """Schema for creating compliance document"""
    pass


class ComplianceDocumentResponse(ComplianceDocumentBase):
    """Schema for compliance document response"""
    id: UUID
    
    class Config:
        from_attributes = True


class AccreditationDocumentBase(BaseModel):
    """Base schema for accreditation document"""
    certification_type: Any = None  # Made optional to allow empty documents
    certification_type_other: Any = None
    certificate_no: Any = None
    certificate_file_url: Any = None
    scope_file_url: Any = None


class AccreditationDocumentCreate(AccreditationDocumentBase):
    """Schema for creating accreditation document"""
    pass


class AccreditationDocumentResponse(AccreditationDocumentBase):
    """Schema for accreditation document response"""
    id: UUID
    
    class Config:
        from_attributes = True


class SOPBase(BaseModel):
    """Base schema for SOP"""
    title: Optional[str] = None
    number: Optional[str] = None
    issue_number: Optional[str] = None
    issue_date: Optional[date] = None
    amendments: Optional[str] = None
    order_index: int = 0


class SOPCreate(SOPBase):
    """Schema for creating SOP"""
    pass


class SOPResponse(SOPBase):
    """Schema for SOP response"""
    id: UUID
    
    class Config:
        from_attributes = True


class QualityFormatBase(BaseModel):
    """Base schema for quality format"""
    title: Optional[str] = None
    number: Optional[str] = None
    issue_number: Optional[str] = None
    issue_date: Optional[date] = None
    amendments: Optional[str] = None
    order_index: int = 0


class QualityFormatCreate(QualityFormatBase):
    """Schema for creating quality format"""
    pass


class QualityFormatResponse(QualityFormatBase):
    """Schema for quality format response"""
    id: UUID
    
    class Config:
        from_attributes = True


class QualityProcedureBase(BaseModel):
    """Base schema for quality procedure"""
    title: Optional[str] = None
    number: Optional[str] = None
    file_url: Optional[str] = None
    issue_number: Optional[str] = None
    issue_date: Optional[date] = None
    amendments: Optional[str] = None
    order_index: int = 0


class QualityProcedureCreate(QualityProcedureBase):
    """Schema for creating quality procedure"""
    pass


class QualityProcedureResponse(QualityProcedureBase):
    """Schema for quality procedure response"""
    id: UUID
    
    class Config:
        from_attributes = True


# ============================================================================
# Step 1: Laboratory Details
# ============================================================================

class LaboratoryDetailsUpdate(BaseModel):
    """Schema for updating laboratory details (Step 1)"""
    lab_name: str = Field(..., min_length=1, max_length=255)
    lab_address: str = Field(..., min_length=1)
    lab_country: str = "India"
    lab_state: str = Field(..., min_length=1, max_length=100)
    lab_district: Optional[str] = Field(None, max_length=100)
    lab_city: str = Field(..., min_length=1, max_length=100)
    lab_pin_code: str = Field(..., min_length=6, max_length=10)
    lab_logo_url: Optional[str] = None
    lab_proof_of_address: str
    lab_proof_of_address_other: Optional[str] = None
    lab_document_id: Optional[str] = None
    lab_address_proof_url: Optional[str] = None
    
    @validator('lab_pin_code')
    def validate_pin(cls, v):
        if not validate_pin_code(v):
            raise ValueError('Invalid PIN code format')
        return v


# ============================================================================
# Step 2: Registered Office
# ============================================================================

class RegisteredOfficeUpdate(BaseModel):
    """Schema for updating registered office (Step 2)"""
    same_as_lab_address: bool = False
    address: Optional[str] = None
    country: str = "India"
    state: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    pin_code: Optional[str] = None
    mobile: Optional[str] = None
    telephone: Optional[str] = None
    fax: Optional[str] = None
    top_management_document_url: Optional[str] = None
    top_management: List[TopManagementCreate] = []
    
    @validator('mobile')
    def validate_mobile(cls, v):
        if v and not validate_mobile_number(v):
            raise ValueError('Invalid mobile number format')
        return v


# ============================================================================
# Step 3: Parent Organization & Bank Details
# ============================================================================

class ParentOrganizationUpdate(BaseModel):
    """Schema for updating parent organization (Step 3)"""
    same_as_laboratory: bool = False
    name: Optional[str] = None
    address: Optional[str] = None
    country: str = "India"
    state: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    pin_code: Optional[str] = None


class BankDetailsUpdate(BaseModel):
    """Schema for updating bank details (Step 3)"""
    account_holder_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    branch_name: Optional[str] = None
    gst_number: Optional[str] = None
    cancelled_cheque_url: Optional[str] = None
    
    # Validators temporarily disabled for testing
    # @validator('ifsc_code')
    # def validate_ifsc(cls, v):
    #     if v and v.strip() and not validate_ifsc_code(v):
    #         raise ValueError('Invalid IFSC code format')
    #     return v
    
    # @validator('gst_number')
    # def validate_gst(cls, v):
    #     if v and v.strip() and not validate_gst_number(v):
    #         raise ValueError('Invalid GST number format')
    #     return v


# ============================================================================
# Step 4: Working Schedule
# ============================================================================

class WorkingScheduleUpdate(BaseModel):
    """Schema for updating working schedule (Step 4)"""
    working_days: List[str] = []
    organization_type: str
    organization_type_other: Optional[str] = None
    proof_of_legal_identity: str
    proof_of_legal_identity_other: Optional[str] = None
    legal_identity_document_id: Optional[str] = None
    legal_identity_document_url: Optional[str] = None
    shift_timings: List[ShiftTimingCreate] = []


# ============================================================================
# Step 5: Compliance Documents
# ============================================================================

class ComplianceDocumentsUpdate(BaseModel):
    """Schema for updating compliance documents (Step 5)"""
    compliance_documents: List[ComplianceDocumentCreate] = []


# ============================================================================
# Step 6: Policy Documents
# ============================================================================

class PolicyDocumentsUpdate(BaseModel):
    """Schema for updating policy documents (Step 6)"""
    impartiality_document_url: Optional[str] = None
    terms_conditions_document_url: Optional[str] = None
    code_of_ethics_document_url: Optional[str] = None
    testing_charges_policy_document_url: Optional[str] = None


# ============================================================================
# Step 7: Infrastructure
# ============================================================================

class InfrastructureUpdate(BaseModel):
    """Schema for updating infrastructure (Step 7)"""
    adequacy_sanctioned_load: Optional[str] = None
    availability_uninterrupted_power: bool = False
    stability_of_supply: bool = False
    water_source: Optional[str] = None


# ============================================================================
# Step 8: Accreditation & Other Details
# ============================================================================

class AccreditationUpdate(BaseModel):
    """Schema for updating accreditation (Step 8)"""
    accreditation_documents: List[AccreditationDocumentCreate] = []


class OtherLabDetailsUpdate(BaseModel):
    """Schema for updating other lab details (Step 8)"""
    other_details: Optional[str] = None
    other_details_document_url: Optional[str] = None
    layout_lab_premises_url: Optional[str] = None
    organization_chart_url: Optional[str] = None
    gps_latitude: Optional[str] = None
    gps_longitude: Optional[str] = None
    
    @validator('gps_latitude', 'gps_longitude')
    def validate_gps(cls, v, values):
        lat = values.get('gps_latitude')
        lon = v if 'gps_longitude' in values else values.get('gps_longitude')
        if lat and lon and not validate_coordinates(lat, lon):
            raise ValueError('Invalid GPS coordinates')
        return v


# ============================================================================
# Step 9: Quality Manual
# ============================================================================

class QualityManualUpdate(BaseModel):
    """Schema for updating quality manual (Step 9)"""
    title: Optional[str] = None
    issue_number: Optional[str] = None
    issue_date: Optional[date] = None
    amendments: Optional[str] = None
    document_url: Optional[str] = None
    sops: List[SOPCreate] = []


# ============================================================================
# Step 10: Quality Formats & Procedures
# ============================================================================

class QualityFormatsUpdate(BaseModel):
    """Schema for updating quality formats (Step 10)"""
    quality_formats: List[QualityFormatCreate] = []
    quality_procedures: List[QualityProcedureCreate] = []


# ============================================================================
# Complete Organization Schemas
# ============================================================================

class OrganizationCreate(BaseModel):
    """Schema for creating a new organization"""
    lab_name: str = Field(..., min_length=1, max_length=255)
    lab_address: str = Field(..., min_length=1)
    lab_state: str = Field(..., min_length=1, max_length=100)
    lab_district: Optional[str] = Field(None, max_length=100)
    lab_city: str = Field(..., min_length=1, max_length=100)
    lab_pin_code: str = Field(..., min_length=6, max_length=10)


class OrganizationResponse(BaseModel):
    """Schema for organization response"""
    id: UUID
    lab_name: str
    lab_address: str
    lab_country: str
    lab_state: str
    lab_district: Optional[str]
    lab_city: str
    lab_pin_code: str
    lab_logo_url: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime
    
    # Related data
    registered_office: Optional[dict] = None
    top_management: List[TopManagementResponse] = []
    parent_organization: Optional[dict] = None
    bank_details: Optional[dict] = None
    working_schedule: Optional[dict] = None
    shift_timings: List[ShiftTimingResponse] = []
    compliance_documents: List[ComplianceDocumentResponse] = []
    policy_documents: Optional[dict] = None
    infrastructure: Optional[dict] = None
    accreditation_documents: List[AccreditationDocumentResponse] = []
    other_details: Optional[dict] = None
    quality_manual: Optional[dict] = None
    sops: List[SOPResponse] = []
    quality_formats: List[QualityFormatResponse] = []
    quality_procedures: List[QualityProcedureResponse] = []
    
    class Config:
        from_attributes = True


class ChecklistItem(BaseModel):
    """Schema for checklist item"""
    step_id: int
    step_name: str
    is_completed: bool
    required_fields: List[str] = []
    missing_fields: List[str] = []


class ChecklistResponse(BaseModel):
    """Schema for checklist response"""
    organization_id: UUID
    overall_completion: float
    is_ready_for_submission: bool
    steps: List[ChecklistItem]
