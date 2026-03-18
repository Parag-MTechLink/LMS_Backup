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
from . import crud, schemas


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


# Project Routes
@router.get("/projects", response_model=List[schemas.ProjectResponse], tags=["Projects"])
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
    return crud.get_projects(
        db, skip=skip, limit=limit,
        client_id=client_id, status=status, search=search
    )


@router.get("/projects/{project_id}", response_model=schemas.ProjectResponse, tags=["Projects"])
def get_project(
    project_id: int, 
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("project:view"))
):
    """Get a specific project"""
    project_data = crud.get_project_with_details(db, project_id)
    if not project_data:
        raise HTTPException(status_code=404, detail="Project not found")
    return project_data


@router.post("/projects", response_model=schemas.ProjectResponse, status_code=201, tags=["Projects"])
def create_project(
    project: schemas.ProjectCreate, 
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("project:full"))
):
    """Create a new project"""
    return crud.create_project(db, project)


@router.put("/projects/{project_id}", response_model=schemas.ProjectResponse, tags=["Projects"])
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
@router.post("/projects/{project_id}/approve/quality", response_model=schemas.ProjectResponse, tags=["Projects"])
def approve_quality(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles("Quality Manager", "Admin"))):
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.quality_manager_approved = True
    _check_and_update_project_status(project, db, current_user)
    db.commit()
    db.refresh(project)
    return project

@router.post("/projects/{project_id}/approve/project", response_model=schemas.ProjectResponse, tags=["Projects"])
def approve_project_manager(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles("Project Manager", "Admin"))):
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.project_manager_approved = True
    _check_and_update_project_status(project, db, current_user)
    db.commit()
    db.refresh(project)
    return project

@router.post("/projects/{project_id}/approve/technical", response_model=schemas.ProjectResponse, tags=["Projects"])
def approve_technical(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles("Technical Manager", "Admin"))):
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.technical_manager_approved = True
    _check_and_update_project_status(project, db, current_user)
    db.commit()
    db.refresh(project)
    return project

@router.post("/projects/{project_id}/assign-tl", response_model=schemas.ProjectResponse, tags=["Projects"])
def assign_team_lead(project_id: int, team_lead_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(require_roles("Project Manager", "Admin"))):
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.team_lead_id = team_lead_id
    project.status = "testing_in_progress"
    db.commit()
    db.refresh(project)

    # Step 5 -> Notify Team Lead
    create_notification(
        db=db,
        recipient_role="Team Lead",
        title="Project Assigned",
        message=f"You have been assigned as the Team Lead for Project: {project.name}. Testing phase started.",
        triggered_by=current_user,
        entity_type="project",
        entity_id=str(project.id),
        entity_url=f"/lab/management/projects/{project.id}"
    )

    return project

@router.post("/projects/{project_id}/submit-report", response_model=schemas.ProjectResponse, tags=["Projects"])
def submit_report(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.status = "report_submitted"
    db.commit()
    db.refresh(project)

    # Step 6 -> Notify Team Lead (for review)
    create_notification(
        db=db,
        recipient_role="Team Lead",
        title="Test Report Submitted",
        message=f"A test report has been submitted for {project.name}. Please review.",
        triggered_by=current_user,
        entity_type="project",
        entity_id=str(project.id),
        entity_url=f"/lab/management/projects/{project.id}"
    )

    return project

@router.post("/projects/{project_id}/tl-review", response_model=schemas.ProjectResponse, tags=["Projects"])
def tl_review(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles("Team Lead", "Admin"))):
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.status = "tl_reviewed"
    db.commit()
    db.refresh(project)

    # Step 6b -> Notify Managers (Triple Approval Group)
    for role in ["Quality Manager", "Project Manager", "Technical Manager"]:
        create_notification(
            db=db,
            recipient_role=role,
            title="Final Approval Required",
            message=f"Team Lead has reviewed {project.name}. Your local approval is now required.",
            triggered_by=current_user,
            entity_type="project",
            entity_id=str(project.id),
            entity_url=f"/lab/management/projects/{project.id}"
        )

    return project

@router.post("/projects/{project_id}/payment-verify", response_model=schemas.ProjectResponse, tags=["Projects"])
def verify_payment(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles("Finance Manager", "Admin"))):
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.payment_completed = True
    if project.status == "approved":
        project.status = "completed"
    else:
        project.status = "payment_pending"
    db.commit()
    db.refresh(project)

    # Step 8 -> Notify Sales/PM on completion
    if project.status == "completed":
        for role in ["Sales Manager", "Project Manager"]:
            create_notification(
                db=db,
                recipient_role=role,
                title="Project Completed",
                message=f"Project {project.name} has been completed (Approvals + Payment confirmed).",
                triggered_by=current_user,
                entity_type="project",
                entity_id=str(project.id),
                entity_url=f"/lab/management/projects/{project.id}"
            )

    return project

def _check_and_update_project_status(project, db: Session, current_user: User):
    if project.quality_manager_approved and project.project_manager_approved and project.technical_manager_approved:
        was_already_approved = (project.status == "approved")
        if project.payment_completed:
            project.status = "completed"
        else:
            project.status = "approved"
        
        # If it just became approved (Step 7 complete), notify Finance Manager
        if project.status == "approved" and not was_already_approved:
            create_notification(
                db=db,
                recipient_role="Finance Manager",
                title="Project Approved - Payment Verification Required",
                message=f"Project {project.name} has received triple approval. Please verify payment to complete.",
                triggered_by=current_user,
                entity_type="project",
                entity_id=str(project.id),
                entity_url=f"/lab/management/projects/{project.id}"
            )
