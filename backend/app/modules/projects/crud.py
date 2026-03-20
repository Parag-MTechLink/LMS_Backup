"""
CRUD operations for Projects and Customers
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from .models import Customer, Project
from app.models.user_model import User
from app.services.rbac_service import log_audit
from .schemas import CustomerCreate, CustomerUpdate, ProjectCreate, ProjectUpdate


# Customer CRUD
def get_customers(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None
) -> List[Customer]:
    """Get all customers with optional search"""
    query = db.query(Customer).filter(Customer.is_deleted == False)
    
    if search:
        search_filter = or_(
            Customer.company_name.ilike(f"%{search}%"),
            Customer.email.ilike(f"%{search}%"),
            Customer.contact_person.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    return query.order_by(Customer.created_at.desc()).offset(skip).limit(limit).all()


def get_customer(db: Session, customer_id: int) -> Optional[Customer]:
    """Get a specific customer by ID"""
    return db.query(Customer).filter(
        and_(Customer.id == customer_id, Customer.is_deleted == False)
    ).first()


def create_customer(db: Session, customer: CustomerCreate) -> Customer:
    """Create a new customer"""
    db_customer = Customer(**customer.model_dump(by_alias=False))
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer


def update_customer(db: Session, customer_id: int, customer: CustomerUpdate) -> Optional[Customer]:
    """Update a customer"""
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        return None
    
    update_data = customer.model_dump(exclude_unset=True, by_alias=False)
    for field, value in update_data.items():
        setattr(db_customer, field, value)
    
    db.commit()
    db.refresh(db_customer)
    return db_customer


def delete_customer(db: Session, customer_id: int) -> bool:
    """Soft delete a customer"""
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        return False
    
    db_customer.is_deleted = True
    db.commit()
    return True


# Project CRUD
def get_projects(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    client_id: Optional[int] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: Optional[User] = None
) -> List[Project]:
    """Get all projects with optional filtering. Lab Managers only see their assigned projects."""
    query = db.query(Project).filter(Project.is_deleted == False)
    
    # If user is a Lab Manager, enforce visibility restrictions
    if current_user and current_user.role == "Lab Manager":
        query = query.filter(Project.manager_id == current_user.id)
    
    if client_id:
        query = query.filter(Project.client_id == client_id)
    if status:
        query = query.filter(Project.status == status)
    if search:
        search_filter = or_(
            Project.name.ilike(f"%{search}%"),
            Project.code.ilike(f"%{search}%"),
            Project.client_name.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    return query.order_by(Project.created_at.desc()).offset(skip).limit(limit).all()


def get_project(db: Session, project_id: int) -> Optional[Project]:
    """Get a specific project by ID"""
    return db.query(Project).filter(
        and_(Project.id == project_id, Project.is_deleted == False)
    ).first()


def create_project(db: Session, project: ProjectCreate, user_id: UUID = None) -> Project:
    """Create a new project"""
    # Get client name for denormalization
    client = get_customer(db, project.client_id)
    client_name = client.company_name if client else None
    
    project_data = project.model_dump(by_alias=False)
    
    if project_data.get('manager_id'):
        manager_user = db.query(User).filter(User.id == project_data['manager_id']).first()
        if manager_user:
            project_data['manager_name'] = manager_user.full_name
    
    db_project = Project(**project_data, client_name=client_name)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    
    if user_id:
        # Use mode='json' to ensure UUIDs and datetimes are serialized
        audit_details = project.model_dump(by_alias=False, mode='json')
        log_audit(
            db, user_id, "project.create",
            resource_type="project", resource_id=str(db_project.id),
            details={
                "name": db_project.name, 
                "client": client_name,
                **audit_details
            }
        )
        db.commit()
        
    return db_project


def update_project(db: Session, project_id: int, project: ProjectUpdate, user_id: UUID = None) -> Optional[Project]:
    """Update a project"""
    db_project = get_project(db, project_id)
    if not db_project:
        return None
    
    # 1. PRE-UPDATE: Capture old state for fields being updated
    old_values = {}
    if user_id:
        update_fields = project.model_dump(exclude_unset=True).keys()
        for field in update_fields:
            if hasattr(db_project, field):
                val = getattr(db_project, field)
                # Handle serialization for old values to match Pydantic's mode='json'
                if isinstance(val, (UUID, datetime)):
                    old_values[field] = str(val)
                else:
                    old_values[field] = val

    # 2. UPDATE: Apply the changes
    update_data = project.model_dump(exclude_unset=True, by_alias=False)
    
    # Update client_name if client_id changed
    if 'client_id' in update_data:
        client = get_customer(db, update_data['client_id'])
        if client:
            update_data['client_name'] = client.company_name

    # Update manager_name if manager_id changed
    if 'manager_id' in update_data:
        if update_data['manager_id']:
            manager_user = db.query(User).filter(User.id == update_data['manager_id']).first()
            if manager_user:
                update_data['manager_name'] = manager_user.full_name
        else:
            update_data['manager_name'] = None
    
    for field, value in update_data.items():
        setattr(db_project, field, value)
    
    db.commit()
    db.refresh(db_project)
    
    # 3. POST-UPDATE: Log the changes
    if user_id:
        # Get new values in JSON format
        new_values = project.model_dump(exclude_unset=True, by_alias=False, mode='json')

        # Calculate Diff (Exclusive of unchanged or internal fields)
        diff = {}
        for field, new_val in new_values.items():
            if field in ['manager_name', 'client_name']:
                continue
                
            old_val = old_values.get(field)
            if old_val != new_val:
                diff[field] = {"old": old_val, "new": new_val}

        # 4. Log specific events if they occurred
        if 'status' in diff:
            log_audit(
                db, user_id, "project.status_change",
                resource_type="project", resource_id=str(project_id),
                details={"from": diff['status']['old'], "to": diff['status']['new']}
            )
        
        if 'manager_id' in diff:
            log_audit(
                db, user_id, "project.assign",
                resource_type="project", resource_id=str(project_id),
                details={"manager_name": db_project.manager_name}
            )

        # 5. Log the general update ONLY IF there are actual changes
        if diff:
            log_audit(
                db, user_id, "project.update",
                resource_type="project", resource_id=str(project_id),
                details=diff
            )
        
        db.commit()
        
    return db_project


def delete_project(db: Session, project_id: int) -> bool:
    """Soft delete a project"""
    db_project = get_project(db, project_id)
    if not db_project:
        return False
    
    db_project.is_deleted = True
    db.commit()
    return True
