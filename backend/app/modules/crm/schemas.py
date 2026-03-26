from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime


# ─── CRM Customer ──────────────────────────────────────────────────────────────

class CRMImportRecord(BaseModel):
    """A single raw record from an external CRM."""
    source_system: str  # salesforce, hubspot, csv, manual
    raw_data: Dict[str, Any]  # all fields as-is from external system


class CRMImportPayload(BaseModel):
    """Bulk import payload — one or many records from a CRM."""
    records: List[CRMImportRecord]


class CRMCustomerResponse(BaseModel):
    """Response schema for a CRM customer record."""
    id: int
    source_system: str
    raw_data: Dict[str, Any]
    migration_status: str
    mapped_customer_id: Optional[int] = None
    mapped_company_name: Optional[str] = None
    mapped_email: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ─── Field Mapping ─────────────────────────────────────────────────────────────

# Valid LMS target fields that CRM fields can map to
LMS_FIELDS = ["company_name", "email", "phone", "contact_person", "region", "address"]


class CRMFieldMappingCreate(BaseModel):
    """Create or update a field mapping for a source system."""
    source_system: str
    crm_field: str
    lms_field: str  # must be one of LMS_FIELDS


class CRMFieldMappingResponse(BaseModel):
    id: int
    source_system: str
    crm_field: str
    lms_field: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ─── Migration ─────────────────────────────────────────────────────────────────

class FieldMapping(BaseModel):
    """A single field mapping used during migration."""
    crm_field: str     # e.g. "contact_number"
    lms_field: str     # e.g. "phone"


class CRMMigrateRequest(BaseModel):
    """
    Request to migrate a CRM record to LMS using the provided field mappings.
    Mappings override any saved source-system mappings.
    """
    mappings: List[FieldMapping]
    overrides: Optional[Dict[str, Any]] = None


class MigrationPreviewResponse(BaseModel):
    """Preview of what will be written to LMS before confirming migration."""
    crm_customer_id: int
    source_system: str
    mapped_fields: Dict[str, Any]    # lms_field -> value
    unmapped_fields: List[str]       # CRM fields with no LMS mapping
    conflicts: List[str]             # e.g. ["email already exists in LMS"]


class BulkMigrationResponse(BaseModel):
    """Summary of a bulk migration operation."""
    total: int
    success: int
    conflicts: int
    errors: int


class CRMImportAndMigrateRequest(BaseModel):
    """Payload for importing and immediately migrating CRM records."""
    source_system: str
    records: List[Dict[str, Any]]
    mappings: List[FieldMapping]


class ImportConflict(BaseModel):
    """Details of a record that failed migration due to a conflict."""
    id: int
    raw_data: Dict[str, Any]
    reason: str


class BulkImportProcessResponse(BaseModel):
    """Final results of the integrated import + migrate operation."""
    total: int
    migrated: int
    already_migrated: int = 0
    conflicts: List[ImportConflict]

class CRMConnectionConfig(BaseModel):
    client_id: str
    client_secret: str

class BulkPreviewRecord(BaseModel):
    id: int
    company_name: str
    email: str
    source_system: str
    status: str # 'ready', 'conflict', 'missing_mapping'
    reason: Optional[str] = None

class BulkPreviewResponse(BaseModel):
    ready: List[BulkPreviewRecord]
    needs_attention: List[BulkPreviewRecord]
    total_found: int
