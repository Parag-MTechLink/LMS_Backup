"""
API routes for Projects and Customers
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

from app.core.database import get_db
from app.dependencies.auth_dependency import get_current_user, require_roles, require_permission
from app.models.user_model import User
from app.services.rbac_service import log_audit
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
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


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
