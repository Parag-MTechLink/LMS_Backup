"""
Organization Service Layer
Business logic for organization operations
"""
from sqlalchemy.orm import Session
from typing import Optional, List
from uuid import UUID
from datetime import datetime, time

from app.modules.organization import models, schemas
from app.utils.exceptions import NotFoundException, BadRequestException


class OrganizationService:
    """Service class for organization operations"""
    
    @staticmethod
    def create_organization(db: Session, org_data: schemas.OrganizationCreate) -> models.Organization:
        """
        Create a new organization
        
        Args:
            db: Database session
            org_data: Organization creation data
        
        Returns:
            Created organization
        """
        organization = models.Organization(**org_data.model_dump())
        db.add(organization)
        db.commit()
        db.refresh(organization)
        return organization
    
    @staticmethod
    def get_organization(db: Session, organization_id: UUID) -> models.Organization:
        """
        Get organization by ID
        
        Args:
            db: Database session
            organization_id: Organization UUID
        
        Returns:
            Organization object
        
        Raises:
            NotFoundException: If organization not found
        """
        organization = db.query(models.Organization).filter(
            models.Organization.id == organization_id
        ).first()
        
        if not organization:
            raise NotFoundException(f"Organization with ID {organization_id} not found")
        
        return organization
    
    @staticmethod
    def get_organizations(
        db: Session,
        skip: int = 0,
        limit: int = 100
    ) -> List[models.Organization]:
        """
        Get list of organizations with pagination
        
        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return
        
        Returns:
            List of organizations
        """
        return db.query(models.Organization).offset(skip).limit(limit).all()
    
    @staticmethod
    def delete_organization(db: Session, organization_id: UUID) -> bool:
        """
        Delete organization
        
        Args:
            db: Database session
            organization_id: Organization UUID
        
        Returns:
            True if deleted successfully
        """
        organization = OrganizationService.get_organization(db, organization_id)
        db.delete(organization)
        db.commit()
        return True
    
    # ========================================================================
    # Step 1: Laboratory Details
    # ========================================================================
    
    @staticmethod
    def update_laboratory_details(
        db: Session,
        organization_id: UUID,
        data: schemas.LaboratoryDetailsUpdate
    ) -> models.Organization:
        """Update laboratory details (Step 1)"""
        organization = OrganizationService.get_organization(db, organization_id)
        
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(organization, key, value)
        
        db.commit()
        db.refresh(organization)
        return organization
    
    # ========================================================================
    # Step 2: Registered Office & Top Management
    # ========================================================================
    
    @staticmethod
    def update_registered_office(
        db: Session,
        organization_id: UUID,
        data: schemas.RegisteredOfficeUpdate
    ) -> models.Organization:
        """Update registered office and top management (Step 2)"""
        organization = OrganizationService.get_organization(db, organization_id)
        
        # Update or create registered office
        if organization.registered_office:
            for key, value in data.model_dump(exclude={'top_management'}, exclude_unset=True).items():
                setattr(organization.registered_office, key, value)
        else:
            office_data = data.model_dump(exclude={'top_management'})
            registered_office = models.RegisteredOffice(
                organization_id=organization_id,
                **office_data
            )
            db.add(registered_office)
        
        # Update top management
        # Delete existing
        db.query(models.TopManagement).filter(
            models.TopManagement.organization_id == organization_id
        ).delete()
        
        # Add new
        for idx, tm_data in enumerate(data.top_management):
            top_mgmt = models.TopManagement(
                organization_id=organization_id,
                order_index=idx,
                **tm_data.model_dump(exclude={'order_index'})
            )
            db.add(top_mgmt)
        
        db.commit()
        db.refresh(organization)
        return organization
    
    # ========================================================================
    # Step 3: Parent Organization & Bank Details
    # ========================================================================
    
    @staticmethod
    def update_parent_organization(
        db: Session,
        organization_id: UUID,
        data: schemas.ParentOrganizationUpdate
    ) -> models.Organization:
        """Update parent organization (Step 3)"""
        organization = OrganizationService.get_organization(db, organization_id)
        
        if organization.parent_organization:
            for key, value in data.model_dump(exclude_unset=True).items():
                setattr(organization.parent_organization, key, value)
        else:
            parent_org = models.ParentOrganization(
                organization_id=organization_id,
                **data.model_dump()
            )
            db.add(parent_org)
        
        db.commit()
        db.refresh(organization)
        return organization
    
    @staticmethod
    def update_bank_details(
        db: Session,
        organization_id: UUID,
        data: schemas.BankDetailsUpdate
    ) -> models.Organization:
        """Update bank details (Step 3)"""
        organization = OrganizationService.get_organization(db, organization_id)
        
        if organization.bank_details:
            for key, value in data.model_dump(exclude_unset=True).items():
                setattr(organization.bank_details, key, value)
        else:
            bank_details = models.BankDetails(
                organization_id=organization_id,
                **data.model_dump()
            )
            db.add(bank_details)
        
        db.commit()
        db.refresh(organization)
        return organization
    
    # ========================================================================
    # Step 4: Working Schedule
    # ========================================================================
    
    @staticmethod
    def update_working_schedule(
        db: Session,
        organization_id: UUID,
        data: schemas.WorkingScheduleUpdate
    ) -> models.Organization:
        """Update working schedule (Step 4)"""
        organization = OrganizationService.get_organization(db, organization_id)
        
        # Update working schedule
        if organization.working_schedule:
            for key, value in data.model_dump(exclude={'shift_timings'}, exclude_unset=True).items():
                setattr(organization.working_schedule, key, value)
        else:
            schedule_data = data.model_dump(exclude={'shift_timings'})
            working_schedule = models.WorkingSchedule(
                organization_id=organization_id,
                **schedule_data
            )
            db.add(working_schedule)
        
        # Update shift timings
        db.query(models.ShiftTiming).filter(
            models.ShiftTiming.organization_id == organization_id
        ).delete()
        
        for idx, shift_data in enumerate(data.shift_timings):
            # Convert string times to time objects
            shift_dict = shift_data.model_dump()
            
            # Robust time parsing
            try:
                if isinstance(shift_dict['shift_from'], str) and shift_dict['shift_from']:
                    shift_dict['shift_from'] = datetime.strptime(shift_dict['shift_from'], '%H:%M').time()
                elif not shift_dict['shift_from']:
                    shift_dict['shift_from'] = time(9, 0) # Default to 9 AM
                
                if isinstance(shift_dict['shift_to'], str) and shift_dict['shift_to']:
                    shift_dict['shift_to'] = datetime.strptime(shift_dict['shift_to'], '%H:%M').time()
                elif not shift_dict['shift_to']:
                    shift_dict['shift_to'] = time(18, 0) # Default to 6 PM
            except (ValueError, TypeError):
                # Fallback defaults if parsing fails
                shift_dict['shift_from'] = time(9, 0)
                shift_dict['shift_to'] = time(18, 0)

            shift_dict['order_index'] = idx
            
            shift = models.ShiftTiming(
                organization_id=organization_id,
                **shift_dict
            )
            db.add(shift)
        
        db.commit()
        db.refresh(organization)
        return organization
    
    # ========================================================================
    # Step 5: Compliance Documents
    # ========================================================================
    
    @staticmethod
    def update_compliance_documents(
        db: Session,
        organization_id: UUID,
        data: schemas.ComplianceDocumentsUpdate
    ) -> models.Organization:
        """Update compliance documents (Step 5)"""
        organization = OrganizationService.get_organization(db, organization_id)
        
        # Delete existing
        db.query(models.ComplianceDocument).filter(
            models.ComplianceDocument.organization_id == organization_id
        ).delete()
        
        # Add new
        for doc_data in data.compliance_documents:
            doc = models.ComplianceDocument(
                organization_id=organization_id,
                **doc_data.model_dump()
            )
            db.add(doc)
        
        db.commit()
        db.refresh(organization)
        return organization
    
    # ========================================================================
    # Step 6: Policy Documents
    # ========================================================================
    
    @staticmethod
    def update_policy_documents(
        db: Session,
        organization_id: UUID,
        data: schemas.PolicyDocumentsUpdate
    ) -> models.Organization:
        """Update policy documents (Step 6)"""
        organization = OrganizationService.get_organization(db, organization_id)
        
        if organization.policy_documents:
            for key, value in data.model_dump(exclude_unset=True).items():
                setattr(organization.policy_documents, key, value)
        else:
            policy_docs = models.PolicyDocuments(
                organization_id=organization_id,
                **data.model_dump()
            )
            db.add(policy_docs)
        
        db.commit()
        db.refresh(organization)
        return organization
    
    # ========================================================================
    # Step 7: Infrastructure
    # ========================================================================
    
    @staticmethod
    def update_infrastructure(
        db: Session,
        organization_id: UUID,
        data: schemas.InfrastructureUpdate
    ) -> models.Organization:
        """Update infrastructure details (Step 7)"""
        organization = OrganizationService.get_organization(db, organization_id)
        
        if organization.infrastructure:
            for key, value in data.model_dump(exclude_unset=True).items():
                setattr(organization.infrastructure, key, value)
        else:
            infrastructure = models.InfrastructureDetails(
                organization_id=organization_id,
                **data.model_dump()
            )
            db.add(infrastructure)
        
        db.commit()
        db.refresh(organization)
        return organization
    
    # ========================================================================
    # Step 8: Accreditation & Other Details
    # ========================================================================
    
    @staticmethod
    def update_accreditation_documents(
        db: Session,
        organization_id: UUID,
        data: schemas.AccreditationUpdate
    ) -> models.Organization:
        """Update accreditation documents (Step 8)"""
        organization = OrganizationService.get_organization(db, organization_id)
        
        # Delete existing
        db.query(models.AccreditationDocument).filter(
            models.AccreditationDocument.organization_id == organization_id
        ).delete()
        
        # Add new
        for doc_data in data.accreditation_documents:
            doc = models.AccreditationDocument(
                organization_id=organization_id,
                **doc_data.model_dump()
            )
            db.add(doc)
        
        db.commit()
        db.refresh(organization)
        return organization
    
    @staticmethod
    def update_other_lab_details(
        db: Session,
        organization_id: UUID,
        data: schemas.OtherLabDetailsUpdate
    ) -> models.Organization:
        """Update other lab details (Step 8)"""
        organization = OrganizationService.get_organization(db, organization_id)
        
        # Convert GPS coordinates to float
        data_dict = data.model_dump(exclude_unset=True)
        if 'gps_latitude' in data_dict and data_dict['gps_latitude']:
            data_dict['gps_latitude'] = float(data_dict['gps_latitude'])
        if 'gps_longitude' in data_dict and data_dict['gps_longitude']:
            data_dict['gps_longitude'] = float(data_dict['gps_longitude'])
        
        if organization.other_details:
            for key, value in data_dict.items():
                setattr(organization.other_details, key, value)
        else:
            other_details = models.OtherLabDetails(
                organization_id=organization_id,
                **data_dict
            )
            db.add(other_details)
        
        db.commit()
        db.refresh(organization)
        return organization
    
    # ========================================================================
    # Step 9: Quality Manual & SOPs
    # ========================================================================
    
    @staticmethod
    def update_quality_manual(
        db: Session,
        organization_id: UUID,
        data: schemas.QualityManualUpdate
    ) -> models.Organization:
        """Update quality manual and SOPs (Step 9)"""
        organization = OrganizationService.get_organization(db, organization_id)
        
        # Update quality manual
        manual_data = data.model_dump(exclude={'sops'})
        if organization.quality_manual:
            for key, value in manual_data.items():
                if value is not None:
                    setattr(organization.quality_manual, key, value)
        else:
            quality_manual = models.QualityManual(
                organization_id=organization_id,
                **manual_data
            )
            db.add(quality_manual)
        
        # Update SOPs
        db.query(models.SOP).filter(
            models.SOP.organization_id == organization_id
        ).delete()
        
        for idx, sop_data in enumerate(data.sops):
            sop = models.SOP(
                organization_id=organization_id,
                order_index=idx,
                **sop_data.model_dump(exclude={'order_index'})
            )
            db.add(sop)
        
        db.commit()
        db.refresh(organization)
        return organization
    
    # ========================================================================
    # Step 10: Quality Formats & Procedures
    # ========================================================================
    
    @staticmethod
    def update_quality_formats(
        db: Session,
        organization_id: UUID,
        data: schemas.QualityFormatsUpdate
    ) -> models.Organization:
        """Update quality formats and procedures (Step 10)"""
        organization = OrganizationService.get_organization(db, organization_id)
        
        # Update quality formats
        db.query(models.QualityFormat).filter(
            models.QualityFormat.organization_id == organization_id
        ).delete()
        
        for idx, format_data in enumerate(data.quality_formats):
            quality_format = models.QualityFormat(
                organization_id=organization_id,
                order_index=idx,
                **format_data.model_dump(exclude={'order_index'})
            )
            db.add(quality_format)
        
        # Update quality procedures
        db.query(models.QualityProcedure).filter(
            models.QualityProcedure.organization_id == organization_id
        ).delete()
        
        for idx, proc_data in enumerate(data.quality_procedures):
            procedure = models.QualityProcedure(
                organization_id=organization_id,
                order_index=idx,
                **proc_data.model_dump(exclude={'order_index'})
            )
            db.add(procedure)
        
        db.commit()
        db.refresh(organization)
        return organization
    
    # ========================================================================
    # Validation & Submission
    # ========================================================================
    
    @staticmethod
    def get_checklist(db: Session, organization_id: UUID) -> schemas.ChecklistResponse:
        """Get validation checklist for organization"""
        organization = OrganizationService.get_organization(db, organization_id)
        
        steps = []
        
        # Step 1: Laboratory Details
        step1_complete = all([
            organization.lab_name,
            organization.lab_address,
            organization.lab_state,
            # organization.lab_district, # Made optional
            organization.lab_city,
            organization.lab_pin_code
        ])
        steps.append(schemas.ChecklistItem(
            step_id=1,
            step_name="Laboratory Details",
            is_completed=step1_complete,
            required_fields=["lab_name", "lab_address", "lab_state", "lab_city", "lab_pin_code"],
            missing_fields=[]
        ))
        
        # Step 2: Registered Office & Top Management
        step2_complete = bool(organization.registered_office) and len(organization.top_management) > 0
        steps.append(schemas.ChecklistItem(
            step_id=2,
            step_name="Registered Office",
            is_completed=step2_complete,
            required_fields=["registered_office", "top_management"],
            missing_fields=[]
        ))
        
        # Step 3: Parent Organization & Bank Details
        # These are optional, so we mark as complete by default
        step3_complete = True
        steps.append(schemas.ChecklistItem(
            step_id=3,
            step_name="Parent Organization",
            is_completed=step3_complete,
            required_fields=[],
            missing_fields=[]
        ))
        
        # Step 4: Working Schedule
        step4_complete = bool(organization.working_schedule) and len(organization.shift_timings) > 0
        steps.append(schemas.ChecklistItem(
            step_id=4,
            step_name="Working Days & Type",
            is_completed=step4_complete,
            required_fields=["working_schedule", "shift_timings"],
            missing_fields=[]
        ))
        
        # Step 5: Compliance Documents
        # Optional, mark as complete
        step5_complete = True
        steps.append(schemas.ChecklistItem(
            step_id=5,
            step_name="Compliance Documents",
            is_completed=step5_complete,
            required_fields=[],
            missing_fields=[]
        ))
        
        # Step 6: Policy Documents
        step6_complete = bool(organization.policy_documents)
        steps.append(schemas.ChecklistItem(
            step_id=6,
            step_name="Undertakings & Policies",
            is_completed=step6_complete,
            required_fields=["policy_documents"],
            missing_fields=[]
        ))
        
        # Step 7: Infrastructure
        step7_complete = bool(organization.infrastructure)
        steps.append(schemas.ChecklistItem(
            step_id=7,
            step_name="Power & Water Supply",
            is_completed=step7_complete,
            required_fields=["infrastructure"],
            missing_fields=[]
        ))
        
        # Step 8: Accreditation & Other Details
        step8_complete = bool(organization.other_details)
        steps.append(schemas.ChecklistItem(
            step_id=8,
            step_name="Accreditation & Other",
            is_completed=step8_complete,
            required_fields=["other_details"],
            missing_fields=[]
        ))
        
        # Step 9: Quality Manual & SOPs
        step9_complete = bool(organization.quality_manual)
        steps.append(schemas.ChecklistItem(
            step_id=9,
            step_name="Quality Manual & SOPs",
            is_completed=step9_complete,
            required_fields=["quality_manual"],
            missing_fields=[]
        ))
        
        # Step 10: Quality Formats & Procedures
        # Optional, mark as complete
        step10_complete = True
        steps.append(schemas.ChecklistItem(
            step_id=10,
            step_name="Quality Formats & Procedures",
            is_completed=step10_complete,
            required_fields=[],
            missing_fields=[]
        ))
        
        completed_steps = sum(1 for step in steps if step.is_completed)
        overall_completion = (completed_steps / len(steps)) * 100 if steps else 0
        
        return schemas.ChecklistResponse(
            organization_id=organization_id,
            overall_completion=overall_completion,
            is_ready_for_submission=all(step.is_completed for step in steps),
            steps=steps
        )
    
    @staticmethod
    def submit_organization(db: Session, organization_id: UUID) -> models.Organization:
        """Submit organization for approval"""
        organization = OrganizationService.get_organization(db, organization_id)
        
        # Validate completeness
        checklist = OrganizationService.get_checklist(db, organization_id)
        if not checklist.is_ready_for_submission:
            raise BadRequestException("Organization is not complete. Please fill all required fields.")
        
        organization.status = models.OrganizationStatus.SUBMITTED
        db.commit()
        db.refresh(organization)
        
        return organization
