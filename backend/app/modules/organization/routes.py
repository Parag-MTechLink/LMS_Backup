"""
Organization API Routes
FastAPI endpoints for organization management
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.modules.organization import schemas, services

router = APIRouter()


def serialize_organization(org):
    """Helper function to serialize organization without nested relationships"""
    return {
        "id": org.id,
        "lab_name": org.lab_name,
        "lab_address": org.lab_address,
        "lab_country": org.lab_country,
        "lab_state": org.lab_state,
        "lab_district": org.lab_district,
        "lab_city": org.lab_city,
        "lab_pin_code": org.lab_pin_code,
        "lab_logo_url": org.lab_logo_url,
        "status": org.status,
        "created_at": org.created_at,
        "updated_at": org.updated_at
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_organization(
    org_data: schemas.OrganizationCreate,
    db: Session = Depends(get_db)
):
    """Create a new organization"""
    organization = services.OrganizationService.create_organization(db, org_data)
    # Return simplified response to avoid lazy-loading issues with empty relationships
    return serialize_organization(organization)


@router.get("/{organization_id}", response_model=schemas.OrganizationResponse)
async def get_organization(
    organization_id: UUID,
    db: Session = Depends(get_db)
):
    """Get organization by ID"""
    organization = services.OrganizationService.get_organization(db, organization_id)
    return organization


@router.get("/", response_model=List[schemas.OrganizationResponse])
async def list_organizations(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all organizations"""
    organizations = services.OrganizationService.get_organizations(db, skip, limit)
    return organizations


@router.delete("/{organization_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_organization(
    organization_id: UUID,
    db: Session = Depends(get_db)
):
    """Delete organization"""
    services.OrganizationService.delete_organization(db, organization_id)
    return None


# ============================================================================
# Step-wise Update Endpoints
# ============================================================================

@router.put("/{organization_id}/laboratory-details")
async def update_laboratory_details(
    organization_id: UUID,
    data: schemas.LaboratoryDetailsUpdate,
    db: Session = Depends(get_db)
):
    """Update laboratory details (Step 1)"""
    organization = services.OrganizationService.update_laboratory_details(db, organization_id, data)
    return serialize_organization(organization)


@router.put("/{organization_id}/registered-office")
async def update_registered_office(
    organization_id: UUID,
    data: schemas.RegisteredOfficeUpdate,
    db: Session = Depends(get_db)
):
    """Update registered office and top management (Step 2)"""
    organization = services.OrganizationService.update_registered_office(db, organization_id, data)
    
    # Return simplified response without nested relationships
    return {
        "id": organization.id,
        "lab_name": organization.lab_name,
        "lab_address": organization.lab_address,
        "lab_country": organization.lab_country,
        "lab_state": organization.lab_state,
        "lab_district": organization.lab_district,
        "lab_city": organization.lab_city,
        "lab_pin_code": organization.lab_pin_code,
        "lab_logo_url": organization.lab_logo_url,
        "status": organization.status,
        "created_at": organization.created_at,
        "updated_at": organization.updated_at
    }


@router.put("/{organization_id}/parent-organization")
async def update_parent_organization(
    organization_id: UUID,
    data: schemas.ParentOrganizationUpdate,
    db: Session = Depends(get_db)
):
    """Update parent organization (Step 3)"""
    organization = services.OrganizationService.update_parent_organization(db, organization_id, data)
    return serialize_organization(organization)


@router.put("/{organization_id}/bank-details")
async def update_bank_details(
    organization_id: UUID,
    data: schemas.BankDetailsUpdate,
    db: Session = Depends(get_db)
):
    """Update bank details (Step 3)"""
    organization = services.OrganizationService.update_bank_details(db, organization_id, data)
    return serialize_organization(organization)


@router.put("/{organization_id}/working-schedule")
async def update_working_schedule(
    organization_id: UUID,
    data: schemas.WorkingScheduleUpdate,
    db: Session = Depends(get_db)
):
    """Update working schedule (Step 4)"""
    organization = services.OrganizationService.update_working_schedule(db, organization_id, data)
    return serialize_organization(organization)


@router.put("/{organization_id}/compliance-documents")
async def update_compliance_documents(
    organization_id: UUID,
    data: schemas.ComplianceDocumentsUpdate,
    db: Session = Depends(get_db)
):
    """Update compliance documents (Step 5)"""
    organization = services.OrganizationService.update_compliance_documents(db, organization_id, data)
    return serialize_organization(organization)


@router.put("/{organization_id}/policy-documents")
async def update_policy_documents(
    organization_id: UUID,
    data: schemas.PolicyDocumentsUpdate,
    db: Session = Depends(get_db)
):
    """Update policy documents (Step 6)"""
    organization = services.OrganizationService.update_policy_documents(db, organization_id, data)
    return serialize_organization(organization)


@router.put("/{organization_id}/infrastructure")
async def update_infrastructure(
    organization_id: UUID,
    data: schemas.InfrastructureUpdate,
    db: Session = Depends(get_db)
):
    """Update infrastructure details (Step 7)"""
    organization = services.OrganizationService.update_infrastructure(db, organization_id, data)
    return serialize_organization(organization)


@router.put("/{organization_id}/accreditation")
async def update_accreditation_documents(
    organization_id: UUID,
    data: schemas.AccreditationUpdate,
    db: Session = Depends(get_db)
):
    """Update accreditation documents (Step 8)"""
    organization = services.OrganizationService.update_accreditation_documents(db, organization_id, data)
    return serialize_organization(organization)


@router.put("/{organization_id}/other-details")
async def update_other_lab_details(
    organization_id: UUID,
    data: schemas.OtherLabDetailsUpdate,
    db: Session = Depends(get_db)
):
    """Update other lab details (Step 8)"""
    organization = services.OrganizationService.update_other_lab_details(db, organization_id, data)
    return serialize_organization(organization)


@router.put("/{organization_id}/quality-manual")
async def update_quality_manual(
    organization_id: UUID,
    data: schemas.QualityManualUpdate,
    db: Session = Depends(get_db)
):
    """Update quality manual and SOPs (Step 9)"""
    organization = services.OrganizationService.update_quality_manual(db, organization_id, data)
    return serialize_organization(organization)


@router.put("/{organization_id}/quality-formats")
async def update_quality_formats(
    organization_id: UUID,
    data: schemas.QualityFormatsUpdate,
    db: Session = Depends(get_db)
):
    """Update quality formats and procedures (Step 10)"""
    organization = services.OrganizationService.update_quality_formats(db, organization_id, data)
    return serialize_organization(organization)


# ============================================================================
# Validation & Submission
# ============================================================================

@router.get("/{organization_id}/checklist", response_model=schemas.ChecklistResponse)
async def get_checklist(
    organization_id: UUID,
    db: Session = Depends(get_db)
):
    """Get validation checklist for organization"""
    checklist = services.OrganizationService.get_checklist(db, organization_id)
    return checklist


@router.post("/{organization_id}/submit")
async def submit_organization(
    organization_id: UUID,
    db: Session = Depends(get_db)
):
    """Submit organization for approval"""
    organization = services.OrganizationService.submit_organization(db, organization_id)
    return serialize_organization(organization)
