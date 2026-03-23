"""
CRUD operations for Projects and Customers
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional

from .models import Customer, Project
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
    search: Optional[str] = None
) -> List[Project]:
    """Get all projects with optional filtering"""
    query = db.query(Project).filter(Project.is_deleted == False)
    
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


def create_project(db: Session, project: ProjectCreate) -> Project:
    """Create a new project"""
    # Get client name for denormalization
    client = get_customer(db, project.client_id)
    client_name = client.company_name if client else None
    
    project_data = project.model_dump(by_alias=False)
    db_project = Project(**project_data, client_name=client_name)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


def update_project(db: Session, project_id: int, project: ProjectUpdate) -> Optional[Project]:
    """Update a project"""
    db_project = get_project(db, project_id)
    if not db_project:
        return None
    
    update_data = project.model_dump(exclude_unset=True, by_alias=False)
    
    # Update client_name if client_id changed
    if 'client_id' in update_data:
        client = get_customer(db, update_data['client_id'])
        if client:
            update_data['client_name'] = client.company_name
    
    for field, value in update_data.items():
        setattr(db_project, field, value)
    
    db.commit()
    db.refresh(db_project)
    return db_project


def delete_project(db: Session, project_id: int) -> bool:
    """Soft delete a project"""
    db_project = get_project(db, project_id)
    if not db_project:
        return False
    
    db_project.is_deleted = True
    db.commit()
    return True
