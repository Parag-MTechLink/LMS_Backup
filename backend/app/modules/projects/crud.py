"""
CRUD operations for Projects and Customers
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional

from .models import Customer, Project, ProjectActivity
from .schemas import CustomerCreate, CustomerUpdate, ProjectCreate, ProjectUpdate
from app.models.user_model import User


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

def get_project_with_details(db: Session, project_id: int) -> Optional[dict]:
    """Get a specific project with Team Lead name"""
    result = db.query(
        Project,
        User.full_name.label("team_lead_name")
    ).outerjoin(User, Project.team_lead_id == User.id).filter(
        and_(Project.id == project_id, Project.is_deleted == False)
    ).first()
    
    if not result:
        return None
        
    project, team_lead_name = result
    # Convert Project model to dict and add team_lead_name
    from .schemas import ProjectResponse
    return {
        "id": project.id,
        "name": project.name,
        "code": project.code,
        "clientId": project.client_id,
        "clientName": project.client_name,
        "status": project.status,
        "oem": project.oem,
        "description": project.description,
        "qualityManagerApproved": project.quality_manager_approved,
        "projectManagerApproved": project.project_manager_approved,
        "technicalManagerApproved": project.technical_manager_approved,
        "paymentCompleted": project.payment_completed,
        "teamLeadId": project.team_lead_id,
        "teamLeadName": team_lead_name,
        "createdAt": project.created_at,
        "updatedAt": project.updated_at,
        "isDeleted": project.is_deleted
    }


def create_project(db: Session, project: ProjectCreate, current_user: User = None) -> Project:
    """Create a new project and log the initial activity"""
    # Get client name for denormalization
    client = get_customer(db, project.client_id)
    client_name = client.company_name if client else None
    
    project_data = project.model_dump(by_alias=False)
    db_project = Project(**project_data, client_name=client_name)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)

    # Log initial activity
    if current_user:
        log_project_activity(
            db, 
            db_project.id, 
            "Customer request recorded", 
            f"Project {db_project.name} created", 
            current_user
        )
        db.commit()
    
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


# Project Activity Logging
def log_project_activity(
    db: Session,
    project_id: int,
    process_step: str,
    action: str,
    user: User
) -> ProjectActivity:
    """Log a workflow activity for a project"""
    activity = ProjectActivity(
        project_id=project_id,
        process_step=process_step,
        action=action,
        user_name=user.full_name,
        user_role=user.role
    )
    db.add(activity)
    db.flush()
    return activity


def get_project_activities(db: Session, project_id: int) -> List[ProjectActivity]:
    """Get all activities for a project ordered by timestamp"""
    return db.query(ProjectActivity).filter(
        ProjectActivity.project_id == project_id
    ).order_by(ProjectActivity.timestamp.asc()).all()
