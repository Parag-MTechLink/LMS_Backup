"""
Quality Assurance Module Pydantic Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import datetime as py_datetime


# ============= SOP Schemas =============

class SOPBase(BaseModel):
    sop_id: str = Field(..., alias="sopId")
    title: str
    category: Optional[str] = None
    version: str
    status: Optional[str] = Field(default='Active')
    effective_date: py_datetime.date = Field(..., alias="effectiveDate")
    next_review_date: Optional[py_datetime.date] = Field(None, alias="nextReviewDate")
    approved_by: Optional[str] = Field(None, alias="approvedBy")
    document_url: Optional[str] = Field(None, alias="documentUrl")
    linked_tests: Optional[List[str]] = Field(None, alias="linkedTests")
    linked_instruments: Optional[List[str]] = Field(None, alias="linkedInstruments")
    linked_departments: Optional[List[str]] = Field(None, alias="linkedDepartments")
    revision_history: Optional[List[Dict[str, Any]]] = Field(None, alias="revisionHistory")

    class Config:
        populate_by_name = True


class SOPCreate(SOPBase):
    sop_id: Optional[str] = Field(None, alias="sopId")


class SOPUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    version: Optional[str] = None
    status: Optional[str] = None
    effective_date: Optional[py_datetime.date] = Field(None, alias="effectiveDate")
    next_review_date: Optional[py_datetime.date] = Field(None, alias="nextReviewDate")
    approved_by: Optional[str] = Field(None, alias="approvedBy")
    document_url: Optional[str] = Field(None, alias="documentUrl")
    linked_tests: Optional[List[str]] = Field(None, alias="linkedTests")
    linked_instruments: Optional[List[str]] = Field(None, alias="linkedInstruments")
    linked_departments: Optional[List[str]] = Field(None, alias="linkedDepartments")
    revision_history: Optional[List[Dict[str, Any]]] = Field(None, alias="revisionHistory")

    class Config:
        populate_by_name = True


class SOPResponse(SOPBase):
    id: int
    created_at: py_datetime.datetime = Field(..., alias="createdAt")
    updated_at: py_datetime.datetime = Field(..., alias="updatedAt")

    class Config:
        from_attributes = True
        populate_by_name = True
        by_alias = True




# ============= Document Schemas =============

class DocumentBase(BaseModel):
    document_id: str = Field(..., alias="documentId")
    title: str
    category: Optional[str] = None
    document_type: Optional[str] = Field(None, alias="documentType")
    version: str
    status: Optional[str] = Field(default='Active')
    effective_date: py_datetime.date = Field(..., alias="effectiveDate")
    approved_by: Optional[str] = Field(None, alias="approvedBy")
    access_level: Optional[str] = Field(None, alias="accessLevel")
    locked: Optional[bool] = Field(default=False)
    download_count: Optional[int] = Field(default=0, alias="downloadCount")
    document_url: Optional[str] = Field(None, alias="documentUrl")

    class Config:
        populate_by_name = True


class DocumentCreate(DocumentBase):
    document_id: Optional[str] = Field(None, alias="documentId")


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    document_type: Optional[str] = Field(None, alias="documentType")
    version: Optional[str] = None
    status: Optional[str] = None
    effective_date: Optional[py_datetime.date] = Field(None, alias="effectiveDate")
    approved_by: Optional[str] = Field(None, alias="approvedBy")
    access_level: Optional[str] = Field(None, alias="accessLevel")
    locked: Optional[bool] = None
    download_count: Optional[int] = Field(None, alias="downloadCount")
    document_url: Optional[str] = Field(None, alias="documentUrl")

    class Config:
        populate_by_name = True


class DocumentResponse(DocumentBase):
    id: int
    created_at: py_datetime.datetime = Field(..., alias="createdAt")
    updated_at: py_datetime.datetime = Field(..., alias="updatedAt")

    class Config:
        from_attributes = True
        populate_by_name = True
        by_alias = True


# ============= QC Check Schemas =============

class AcceptanceRange(BaseModel):
    min: float
    max: float


class QCCheckBase(BaseModel):
    qc_id: str = Field(..., alias="qcId")
    test_name: str = Field(..., alias="testName")
    parameter: str
    target_value: float = Field(..., alias="targetValue")
    unit: Optional[str] = None
    acceptance_range: AcceptanceRange = Field(..., alias="acceptanceRange")
    last_result: Optional[float] = Field(None, alias="lastResult")
    status: Optional[str] = None
    frequency: Optional[str] = None
    last_check_date: Optional[py_datetime.date] = Field(None, alias="lastCheckDate")
    deviation: Optional[bool] = Field(default=False)
    trend: Optional[List[Dict[str, Any]]] = None

    class Config:
        populate_by_name = True


class QCCheckCreate(QCCheckBase):
    qc_id: Optional[str] = Field(None, alias="qcId")


class QCCheckUpdate(BaseModel):
    test_name: Optional[str] = Field(None, alias="testName")
    parameter: Optional[str] = None
    target_value: Optional[float] = Field(None, alias="targetValue")
    unit: Optional[str] = None
    acceptance_range: Optional[AcceptanceRange] = Field(None, alias="acceptanceRange")
    last_result: Optional[float] = Field(None, alias="lastResult")
    status: Optional[str] = None
    frequency: Optional[str] = None
    last_check_date: Optional[py_datetime.date] = Field(None, alias="lastCheckDate")
    deviation: Optional[bool] = None
    trend: Optional[List[Dict[str, Any]]] = None

    class Config:
        populate_by_name = True


class QCCheckResponse(BaseModel):
    id: int
    qc_id: str = Field(..., alias="qcId")
    test_name: str = Field(..., alias="testName")
    parameter: str
    target_value: float = Field(..., alias="targetValue")
    unit: Optional[str] = None
    acceptance_range: AcceptanceRange = Field(..., alias="acceptanceRange")
    last_result: Optional[float] = Field(None, alias="lastResult")
    status: Optional[str] = None
    frequency: Optional[str] = None
    last_check_date: Optional[py_datetime.date] = Field(None, alias="lastCheckDate")
    deviation: Optional[bool] = None
    trend: Optional[List[Dict[str, Any]]] = None
    created_at: py_datetime.datetime = Field(..., alias="createdAt")
    updated_at: py_datetime.datetime = Field(..., alias="updatedAt")

    class Config:
        from_attributes = True
        populate_by_name = True
        by_alias = True


# ============= NC/CAPA Schemas =============

class NCCAPABase(BaseModel):
    nc_id: str = Field(..., alias="ncId")
    description: str
    severity: str
    status: Optional[str] = Field(default='Open')
    impacted_area: Optional[str] = Field(None, alias="impactedArea")
    action_owner: Optional[str] = Field(None, alias="actionOwner")
    due_date: py_datetime.date = Field(..., alias="dueDate")
    closure_date: Optional[py_datetime.date] = Field(None, alias="closureDate")
    root_cause: Optional[str] = Field(None, alias="rootCause")
    corrective_action: Optional[str] = Field(None, alias="correctiveAction")
    preventive_action: Optional[str] = Field(None, alias="preventiveAction")

    class Config:
        populate_by_name = True


class NCCAPACreate(NCCAPABase):
    nc_id: Optional[str] = Field(None, alias="ncId")


class NCCAPAUpdate(BaseModel):
    description: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    impacted_area: Optional[str] = Field(None, alias="impactedArea")
    action_owner: Optional[str] = Field(None, alias="actionOwner")
    due_date: Optional[py_datetime.date] = Field(None, alias="dueDate")
    closure_date: Optional[py_datetime.date] = Field(None, alias="closureDate")
    root_cause: Optional[str] = Field(None, alias="rootCause")
    corrective_action: Optional[str] = Field(None, alias="correctiveAction")
    preventive_action: Optional[str] = Field(None, alias="preventiveAction")

    class Config:
        populate_by_name = True


class NCCAPAResponse(NCCAPABase):
    id: int
    created_at: py_datetime.datetime = Field(..., alias="createdAt")
    updated_at: py_datetime.datetime = Field(..., alias="updatedAt")

    class Config:
        from_attributes = True
        populate_by_name = True
        by_alias = True


# ============= Audit Schemas =============

class AuditBase(BaseModel):
    audit_id: str = Field(..., alias="auditId")
    audit_type: str = Field(..., alias="auditType")
    date: py_datetime.date
    auditor_name: str = Field(..., alias="auditorName")
    auditor_organization: Optional[str] = Field(None, alias="auditorOrganization")
    scope: str
    status: Optional[str] = Field(default='Scheduled')
    findings: Optional[List[Dict[str, Any]]] = None
    total_findings: Optional[int] = Field(default=0, alias="totalFindings")
    open_findings: Optional[int] = Field(default=0, alias="openFindings")
    closed_findings: Optional[int] = Field(default=0, alias="closedFindings")
    compliance_score: Optional[float] = Field(None, alias="complianceScore")
    report_url: Optional[str] = Field(None, alias="reportUrl")
    next_audit_date: Optional[py_datetime.date] = Field(None, alias="nextAuditDate")

    class Config:
        populate_by_name = True


class AuditCreate(AuditBase):
    audit_id: Optional[str] = Field(None, alias="auditId")


class AuditUpdate(BaseModel):
    audit_type: Optional[str] = Field(None, alias="auditType")
    date: Optional[py_datetime.date] = None
    auditor_name: Optional[str] = Field(None, alias="auditorName")
    auditor_organization: Optional[str] = Field(None, alias="auditorOrganization")
    scope: Optional[str] = None
    status: Optional[str] = None
    findings: Optional[List[Dict[str, Any]]] = None
    total_findings: Optional[int] = Field(None, alias="totalFindings")
    open_findings: Optional[int] = Field(None, alias="openFindings")
    closed_findings: Optional[int] = Field(None, alias="closedFindings")
    compliance_score: Optional[float] = Field(None, alias="complianceScore")
    report_url: Optional[str] = Field(None, alias="reportUrl")
    next_audit_date: Optional[py_datetime.date] = Field(None, alias="nextAuditDate")

    class Config:
        populate_by_name = True


class AuditResponse(AuditBase):
    id: int
    created_at: py_datetime.datetime = Field(..., alias="createdAt")
    updated_at: py_datetime.datetime = Field(..., alias="updatedAt")

    class Config:
        from_attributes = True
        populate_by_name = True
        by_alias = True
