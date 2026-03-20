"""
API routes for Projects and Customers
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.dependencies.auth_dependency import get_current_user, require_roles, require_permission
from app.models.user_model import User
from app.services.rbac_service import log_audit
from app.routes.notifications import create_notification
from app.modules.projects import crud, schemas


router = APIRouter()


# Customer Routes
@router.get("/customers", response_model=List[schemas.CustomerResponse], tags=["Customers"])
def list_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all customers with optional search"""
    return crud.get_customers(db, skip=skip, limit=limit, search=search)


@router.get("/customers/{customer_id}", response_model=schemas.CustomerResponse, tags=["Customers"])
def get_customer(
    customer_id: int, 
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("customer:view"))
):
    """Get a specific customer"""
    customer = crud.get_customer(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.post("/customers", response_model=schemas.CustomerResponse, status_code=201, tags=["Customers"])
def create_customer(
    customer: schemas.CustomerCreate, 
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("customer:full"))
):
    """Create a new customer"""
    # Custom uniqueness checks
    if customer.phone:
        existing_phone = db.query(crud.Customer).filter(
            crud.Customer.phone == customer.phone, 
            crud.Customer.is_deleted == False
        ).first()
        if existing_phone:
            raise HTTPException(status_code=409, detail="A customer with this phone number already exists.")
            
    if customer.contact_person:
        existing_contact = db.query(crud.Customer).filter(
            crud.Customer.contact_person == customer.contact_person, 
            crud.Customer.is_deleted == False
        ).first()
        if existing_contact:
            raise HTTPException(status_code=409, detail="A customer with this contact person already exists.")

    try:
        return crud.create_customer(db, customer)
    except IntegrityError as e:
        db.rollback()
        msg = str(e.orig) if getattr(e, "orig", None) else str(e)
        if "ix_customers_email" in msg or "email" in msg.lower():
            raise HTTPException(status_code=409, detail="A customer with this email already exists.")
        raise HTTPException(status_code=409, detail="A customer with this data already exists.")


@router.put("/customers/{customer_id}", response_model=schemas.CustomerResponse, tags=["Customers"])
def update_customer(
    customer_id: int,
    customer: schemas.CustomerUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("customer:full"))
):
    """Update a customer"""
    updated_customer = crud.update_customer(db, customer_id, customer)
    if not updated_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return updated_customer


@router.delete("/customers/{customer_id}", status_code=204, tags=["Customers"])
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin")),
):
    """Delete a customer (Admin only). Soft delete; audit logged."""
    success = crud.delete_customer(db, customer_id)
    if not success:
        raise HTTPException(status_code=404, detail="Customer not found")
    log_audit(
        db, current_user.id, "customer.delete",
        resource_type="customer", resource_id=str(customer_id),
        details={"role": current_user.role},
    )
    db.commit()
    return None


def _populate_pending_approvals(project):
    """Calculate pending approvals for a project. Handles both dicts (camel/snake) and ORM objects."""
    pending = []
    
    if isinstance(project, dict):
        # Support both snake_case (ORM/internal) and camelCase (API response)
        q_app = project.get('quality_manager_approved') or project.get('qualityManagerApproved')
        p_app = project.get('project_manager_approved') or project.get('projectManagerApproved')
        t_app = project.get('technical_manager_approved') or project.get('technicalManagerApproved')
        
        if not q_app: pending.append("Quality Manager")
        if not p_app: pending.append("Project Manager")
        if not t_app: pending.append("Technical Manager")
        
        # Set both for safety, but frontend expects camelCase
        project['pending_approvals'] = pending
        project['pendingApprovals'] = pending
    else:
        # If project is an ORM object
        if not project.quality_manager_approved:
            pending.append("Quality Manager")
        if not project.project_manager_approved:
            pending.append("Project Manager")
        if not project.technical_manager_approved:
            pending.append("Technical Manager")
        setattr(project, 'pending_approvals', pending)
        # We don't need to set camelCase on ORM objects as Pydantic handles aliasing
    return project


def _build_workflow_response(db: Session, project_id: int):
    """Build a full ProjectResponse-compatible dict after a workflow action."""
    project_data = crud.get_project_with_details(db, project_id)
    if project_data:
        _populate_pending_approvals(project_data)
    return project_data


# Project Routes
@router.get("/projects", response_model=List[schemas.ProjectResponse], response_model_by_alias=True, tags=["Projects"])
def list_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    client_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("project:view"))
):
    """Get all projects with optional filtering"""
    projects = crud.get_projects(
        db, skip=skip, limit=limit,
        client_id=client_id, status=status, search=search
    )
    for p in projects:
        _populate_pending_approvals(p)
    return projects


@router.get("/projects/{project_id}", response_model=schemas.ProjectResponse, response_model_by_alias=True, tags=["Projects"])
def get_project(
    project_id: int, 
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("project:view"))
):
    """Get a specific project"""
    project_data = crud.get_project_with_details(db, project_id)
    if not project_data:
        raise HTTPException(status_code=404, detail="Project not found")
    _populate_pending_approvals(project_data)
    return project_data


@router.post("/projects", response_model=schemas.ProjectResponse, response_model_by_alias=True, status_code=201, tags=["Projects"])
def create_project(
    project: schemas.ProjectCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("project:full"))
):
    """Create a new project"""
    return crud.create_project(db, project, current_user=current_user)


@router.get("/projects/{project_id}/activities", response_model=List[schemas.ProjectActivityResponse], tags=["Projects"])
def get_project_activities(
    project_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("project:view"))
):
    """Get chronological activity history for a project"""
    return crud.get_project_activities(db, project_id)


@router.put("/projects/{project_id}", response_model=schemas.ProjectResponse, response_model_by_alias=True, tags=["Projects"])
def update_project(
    project_id: int,
    project: schemas.ProjectUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("project:full"))
):
    """Update a project"""
    updated_project = crud.update_project(db, project_id, project)
    if not updated_project:
        raise HTTPException(status_code=404, detail="Project not found")
    return updated_project


@router.delete("/projects/{project_id}", status_code=204, tags=["Projects"])
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin")),
):
    """Delete a project (Admin only). Soft delete; audit logged."""
    success = crud.delete_project(db, project_id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")
    log_audit(
        db, current_user.id, "project.delete",
        resource_type="project", resource_id=str(project_id),
        details={"role": current_user.role},
    )
    db.commit()
    return None


# 🔹 PROJECT APPROVAL ENDPOINTS
@router.post("/projects/{project_id}/approve/quality", response_model=schemas.ProjectResponse, response_model_by_alias=True, tags=["Projects"])
def approve_quality(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles("Quality Manager", "Admin"))):
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.quality_manager_approved = True
    
    # Log activity
    crud.log_project_activity(
        db, project.id, "Triple Management Approval", 
        f"Approved by {current_user.full_name} – Quality Manager", 
        current_user
    )
    
    _check_and_update_project_status(project, db, current_user)
    db.commit()
    return _build_workflow_response(db, project.id)

@router.post("/projects/{project_id}/approve/project", response_model=schemas.ProjectResponse, response_model_by_alias=True, tags=["Projects"])
def approve_project_manager(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles("Project Manager", "Admin"))):
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.project_manager_approved = True
    
    # Log activity
    crud.log_project_activity(
        db, project.id, "Triple Management Approval", 
        f"Approved by {current_user.full_name} – Project Manager", 
        current_user
    )
    
    _check_and_update_project_status(project, db, current_user)
    db.commit()
    return _build_workflow_response(db, project.id)

@router.post("/projects/{project_id}/approve/technical", response_model=schemas.ProjectResponse, response_model_by_alias=True, tags=["Projects"])
def approve_technical(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles("Technical Manager", "Admin"))):
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.technical_manager_approved = True
    
    # Log activity
    crud.log_project_activity(
        db, project.id, "Triple Management Approval", 
        f"Approved by {current_user.full_name} – Technical Manager", 
        current_user
    )
    
    _check_and_update_project_status(project, db, current_user)
    db.commit()
    return _build_workflow_response(db, project.id)

@router.post("/projects/{project_id}/assign-tl", response_model=schemas.ProjectResponse, response_model_by_alias=True, tags=["Projects"])
def assign_team_lead(project_id: int, team_lead_id: UUID = Query(...), db: Session = Depends(get_db), current_user: User = Depends(require_roles("Project Manager", "Admin"))):
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Fetch team lead name for activity log
    team_lead = db.query(User).filter(User.id == team_lead_id).first()
    if not team_lead:
        raise HTTPException(status_code=404, detail="Team Lead user not found")

    project.team_lead_id = team_lead_id
    project.status = "testing_in_progress"
    
    # Log activity
    crud.log_project_activity(
        db, 
        project.id, 
        "Team Lead assigned", 
        f"Assigned {team_lead.full_name} as Team Lead", 
        current_user
    )

    # Step 5 -> Notify Team Lead
    create_notification(
        db=db,
        recipient_role="Team Lead",
        title="Project Assigned",
        message=f"{current_user.full_name} – {current_user.role} assigned you as Team Lead for Project {project.name}. Testing can now begin.",
        triggered_by=current_user,
        entity_type="project",
        entity_id=str(project.id),
        entity_url=f"/lab/management/projects/{project.id}"
    )

    db.commit()
    return _build_workflow_response(db, project.id)

@router.post("/projects/{project_id}/submit-report", response_model=schemas.ProjectResponse, response_model_by_alias=True, tags=["Projects"])
def submit_report(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles("Team Lead", "Technical Manager", "Admin"))):
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.status != "testing_in_progress":
        raise HTTPException(status_code=400, detail="Project must be in 'Testing In Progress' status to submit a report")
    
    # 🔹 Verify assigned Team Lead (Step 6)
    if current_user.role == "Team Lead" and project.team_lead_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the assigned Team Lead can submit the report for this project")

    project.status = "report_submitted"

    # Log activity
    crud.log_project_activity(
        db, 
        project.id, 
        "Test report submitted", 
        f"Test report submitted for review", 
        current_user
    )

    # Step 6 -> Notify Team Lead (for review)
    create_notification(
        db=db,
        recipient_role="Team Lead",
        title="Test Report Submitted",
        message=f"{current_user.full_name} – {current_user.role} submitted the Test Report. Awaiting review from Team Lead.",
        triggered_by=current_user,
        entity_type="project",
        entity_id=str(project.id),
        entity_url=f"/lab/management/projects/{project.id}"
    )

    db.commit()
    return _build_workflow_response(db, project.id)


@router.post("/projects/{project_id}/tl-review", response_model=schemas.ProjectResponse, response_model_by_alias=True, tags=["Projects"])
def tl_review(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles("Team Lead", "Admin"))):
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.status != "report_submitted":
        raise HTTPException(status_code=400, detail="Project must be in 'Report Submitted' status for TL review")
    
    # 🔹 Verify assigned Team Lead (Step 6b)
    if current_user.role == "Team Lead" and project.team_lead_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the assigned Team Lead can complete the review for this project")

    project.status = "tl_reviewed"

    # Log activity
    crud.log_project_activity(
        db, 
        project.id, 
        "Team Lead review completed", 
        f"Team Lead review finalized", 
        current_user
    )

    # Step 6b -> Notify Managers (Triple Approval Group)
    for role in ["Quality Manager", "Project Manager", "Technical Manager"]:
        create_notification(
            db=db,
            recipient_role=role,
            title="Final Approval Required",
            message=f"{current_user.full_name} – {current_user.role} completed the Team Lead Review. Awaiting approval from {role}.",
            triggered_by=current_user,
            entity_type="project",
            entity_id=str(project.id),
            entity_url=f"/lab/management/projects/{project.id}"
        )

    db.commit()
    return _build_workflow_response(db, project.id)

@router.post("/projects/{project_id}/payment-verify", response_model=schemas.ProjectResponse, response_model_by_alias=True, tags=["Projects"])
def verify_payment(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles("Finance Manager", "Admin"))):
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.payment_completed = True
    
    # Log activity
    crud.log_project_activity(
        db, project.id, "Payment Verification", 
        f"Payment verified by {current_user.full_name} – Finance Manager", 
        current_user
    )

    if project.quality_manager_approved and project.project_manager_approved and project.technical_manager_approved:
        project.status = "completed"
    else:
        project.status = "payment_pending"

    # Notify on completion
    if project.status == "completed":
        crud.log_project_activity(
            db, project.id, "Process completed", 
            "System finalized project as Completed", 
            current_user
        )
        for role in ["Sales Manager", "Project Manager"]:
            create_notification(
                db=db,
                recipient_role=role,
                title="Project Completed",
                message=f"{current_user.full_name} – Finance Manager confirmed payment. The project has been Completed.",
                triggered_by=current_user,
                entity_type="project",
                entity_id=str(project.id),
                entity_url=f"/lab/management/projects/{project.id}"
            )

    db.commit()
    return _build_workflow_response(db, project.id)

def _check_and_update_project_status(project, db: Session, current_user: User):
    if project.quality_manager_approved and project.project_manager_approved and project.technical_manager_approved:
        was_already_approved = (project.status == "approved")
        if project.payment_completed:
            project.status = "completed"
            # Log final completion step
            crud.log_project_activity(
                db, project.id, "Process completed", 
                "System finalized project as Completed", 
                User(full_name="System", role="System")
            )
        else:
            project.status = "approved"
        
        # If it just became approved (Step 7 complete), notify Finance Manager
        if project.status == "approved" and not was_already_approved:
            create_notification(
                db=db,
                recipient_role="Finance Manager",
                title="Project Approved - Payment Verification Required",
                message=f"{current_user.full_name} – {current_user.role} approved. Project has received triple approval. Please verify payment to complete.",
                triggered_by=current_user,
                entity_type="project",
                entity_id=str(project.id),
                entity_url=f"/lab/management/projects/{project.id}"
            )
        elif project.status == "completed":
            create_notification(
                db=db,
                recipient_role="Admin",
                title="Project Completed",
                message=f"{current_user.full_name} – {current_user.role} approved. The project has been Completed.",
                triggered_by=current_user,
                entity_type="project",
                entity_id=str(project.id),
                entity_url=f"/lab/management/projects/{project.id}"
            )
