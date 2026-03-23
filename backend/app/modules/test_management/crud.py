"""
CRUD operations for Test Management
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional
from datetime import datetime

from .models import TestPlan, TestExecution, TestResult, TestPlanTemplate, TestParameter
from .schemas import (
    TestPlanCreate, TestPlanUpdate,
    TestExecutionCreate, TestExecutionUpdate,
    TestResultCreate, TestResultUpdate, TestResultReview,
    TestPlanTemplateCreate, TestParameterCreate
)


# Test Plan CRUD
def get_test_plans(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    project_id: Optional[int] = None,
    status: Optional[str] = None,
    test_type: Optional[str] = None,
    search: Optional[str] = None
) -> List[TestPlan]:
    """Get all test plans with optional filtering"""
    query = db.query(TestPlan).filter(TestPlan.is_deleted == False)
    
    if project_id:
        query = query.filter(TestPlan.project_id == project_id)
    if status:
        query = query.filter(TestPlan.status == status)
    if test_type:
        query = query.filter(TestPlan.test_type == test_type)
    if search:
        search_filter = or_(
            TestPlan.name.ilike(f"%{search}%"),
            TestPlan.description.ilike(f"%{search}%"),
            TestPlan.project_name.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    return query.order_by(TestPlan.created_at.desc()).offset(skip).limit(limit).all()


def get_test_plan(db: Session, test_plan_id: int) -> Optional[TestPlan]:
    """Get a specific test plan by ID"""
    return db.query(TestPlan).filter(
        and_(TestPlan.id == test_plan_id, TestPlan.is_deleted == False)
    ).first()


def create_test_plan(db: Session, test_plan: TestPlanCreate, created_by: Optional[int] = None) -> TestPlan:
    """Create a new test plan"""
    # Get project name if project_id is provided
    project_name = test_plan.project_name
    if test_plan.project_id and not project_name:
        try:
            from app.modules.projects.crud import get_project
            project = get_project(db, test_plan.project_id)
            if project:
                project_name = project.name
        except ImportError:
            # Projects module not available, use provided project_name
            pass
    
    # Exclude project_name from dict to avoid duplicate
    test_plan_data = test_plan.dict(exclude={'project_name'})
    db_test_plan = TestPlan(
        **test_plan_data,
        project_name=project_name,
        created_by=created_by,
        status="Draft"
    )
    db.add(db_test_plan)
    db.commit()
    db.refresh(db_test_plan)
    return db_test_plan


def update_test_plan(db: Session, test_plan_id: int, test_plan: TestPlanUpdate) -> Optional[TestPlan]:
    """Update a test plan"""
    db_test_plan = get_test_plan(db, test_plan_id)
    if not db_test_plan:
        return None
    
    update_data = test_plan.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_test_plan, field, value)
    
    db.commit()
    db.refresh(db_test_plan)
    return db_test_plan


def delete_test_plan(db: Session, test_plan_id: int) -> bool:
    """Soft delete a test plan"""
    db_test_plan = get_test_plan(db, test_plan_id)
    if not db_test_plan:
        return False
    
    db_test_plan.is_deleted = True
    db.commit()
    return True


def approve_test_plan(db: Session, test_plan_id: int) -> Optional[TestPlan]:
    """Approve a test plan"""
    db_test_plan = get_test_plan(db, test_plan_id)
    if not db_test_plan:
        return None
    
    db_test_plan.status = "Approved"
    db.commit()
    db.refresh(db_test_plan)
    return db_test_plan


# Test Execution CRUD
def get_test_executions(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    test_plan_id: Optional[int] = None,
    status: Optional[str] = None
) -> List[TestExecution]:
    """Get all test executions with optional filtering"""
    query = db.query(TestExecution).filter(TestExecution.is_deleted == False)
    
    if test_plan_id:
        query = query.filter(TestExecution.test_plan_id == test_plan_id)
    if status:
        query = query.filter(TestExecution.status == status)
    
    return query.order_by(TestExecution.created_at.desc()).offset(skip).limit(limit).all()


def get_test_execution(db: Session, execution_id: int) -> Optional[TestExecution]:
    """Get a specific test execution by ID"""
    return db.query(TestExecution).filter(
        and_(TestExecution.id == execution_id, TestExecution.is_deleted == False)
    ).first()


def create_test_execution(db: Session, execution: TestExecutionCreate) -> TestExecution:
    """Create a new test execution"""
    # Get the next execution number for this test plan
    max_number = db.query(func.max(TestExecution.execution_number)).filter(
        TestExecution.test_plan_id == execution.test_plan_id
    ).scalar() or 0
    
    db_execution = TestExecution(
        **execution.dict(),
        execution_number=max_number + 1,
        status="Pending"
    )
    db.add(db_execution)
    db.commit()
    db.refresh(db_execution)
    return db_execution


def update_test_execution(db: Session, execution_id: int, execution: TestExecutionUpdate) -> Optional[TestExecution]:
    """Update a test execution"""
    db_execution = get_test_execution(db, execution_id)
    if not db_execution:
        return None
    
    update_data = execution.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_execution, field, value)
    
    db.commit()
    db.refresh(db_execution)
    return db_execution


def delete_test_execution(db: Session, execution_id: int) -> bool:
    """Soft delete a test execution"""
    db_execution = get_test_execution(db, execution_id)
    if not db_execution:
        return False
    
    db_execution.is_deleted = True
    db.commit()
    return True


def start_test_execution(db: Session, execution_id: int) -> Optional[TestExecution]:
    """Start a test execution"""
    db_execution = get_test_execution(db, execution_id)
    if not db_execution:
        return None
    
    db_execution.status = "InProgress"
    db_execution.start_time = datetime.utcnow()
    db.commit()
    db.refresh(db_execution)
    return db_execution


def complete_test_execution(db: Session, execution_id: int) -> Optional[TestExecution]:
    """Complete a test execution"""
    db_execution = get_test_execution(db, execution_id)
    if not db_execution:
        return None
    
    db_execution.status = "Completed"
    db_execution.end_time = datetime.utcnow()
    db.commit()
    db.refresh(db_execution)
    return db_execution


# Test Result CRUD
def get_test_results(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    execution_id: Optional[int] = None,
    pass_fail: Optional[bool] = None
) -> List[TestResult]:
    """Get all test results with optional filtering"""
    query = db.query(TestResult)
    
    if execution_id:
        query = query.filter(TestResult.test_execution_id == execution_id)
    if pass_fail is not None:
        query = query.filter(TestResult.pass_fail == pass_fail)
    
    return query.order_by(TestResult.test_date.desc()).offset(skip).limit(limit).all()


def get_test_result(db: Session, result_id: int) -> Optional[TestResult]:
    """Get a specific test result by ID"""
    return db.query(TestResult).filter(TestResult.id == result_id).first()


def create_test_result(db: Session, result: TestResultCreate) -> TestResult:
    """Create a new test result"""
    result_data = result.dict()
    if not result_data.get('test_date'):
        result_data['test_date'] = datetime.utcnow()
    
    db_result = TestResult(**result_data)
    db.add(db_result)
    db.commit()
    db.refresh(db_result)
    return db_result


def update_test_result(db: Session, result_id: int, result: TestResultUpdate) -> Optional[TestResult]:
    """Update a test result"""
    db_result = get_test_result(db, result_id)
    if not db_result:
        return None
    
    update_data = result.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_result, field, value)
    
    db.commit()
    db.refresh(db_result)
    return db_result


def delete_test_result(db: Session, result_id: int) -> bool:
    """Delete a test result"""
    db_result = get_test_result(db, result_id)
    if not db_result:
        return False
    
    db.delete(db_result)
    db.commit()
    return True


def review_test_result(db: Session, result_id: int, review: TestResultReview) -> Optional[TestResult]:
    """Review a test result"""
    db_result = get_test_result(db, result_id)
    if not db_result:
        return None
    
    db_result.reviewed_by_id = review.reviewed_by_id
    db_result.reviewed_by_name = review.reviewed_by_name
    db_result.reviewed_at = datetime.utcnow()
    if review.remarks:
        db_result.remarks = review.remarks
    
    db.commit()
    db.refresh(db_result)
    return db_result


def get_test_result_statistics(db: Session, execution_id: Optional[int] = None) -> dict:
    """Get test result statistics"""
    query = db.query(TestResult)
    if execution_id:
        query = query.filter(TestResult.test_execution_id == execution_id)
    
    total = query.count()
    passed = query.filter(TestResult.pass_fail == True).count()
    failed = query.filter(TestResult.pass_fail == False).count()
    
    pass_rate = (passed / total * 100) if total > 0 else 0
    
    # Statistics by test type
    by_test_type = {}
    test_types = db.query(TestResult.test_type).distinct().all()
    for (test_type,) in test_types:
        if test_type:
            type_total = query.filter(TestResult.test_type == test_type).count()
            type_passed = query.filter(
                and_(TestResult.test_type == test_type, TestResult.pass_fail == True)
            ).count()
            by_test_type[test_type] = {
                "total": type_total,
                "passed": type_passed,
                "failed": type_total - type_passed
            }
    
    return {
        "total_results": total,
        "passed": passed,
        "failed": failed,
        "pass_rate": round(pass_rate, 2),
        "by_test_type": by_test_type
    }


# Template CRUD
def get_test_plan_templates(db: Session, test_type: Optional[str] = None) -> List[TestPlanTemplate]:
    """Get all test plan templates"""
    query = db.query(TestPlanTemplate).filter(TestPlanTemplate.is_active == True)
    if test_type:
        query = query.filter(TestPlanTemplate.test_type == test_type)
    return query.all()


def create_test_plan_template(db: Session, template: TestPlanTemplateCreate) -> TestPlanTemplate:
    """Create a new test plan template"""
    db_template = TestPlanTemplate(**template.dict())
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template


# Parameter CRUD
def get_test_parameters(db: Session, test_type: Optional[str] = None) -> List[TestParameter]:
    """Get all test parameters"""
    query = db.query(TestParameter).filter(TestParameter.is_active == True)
    if test_type:
        query = query.filter(TestParameter.test_type == test_type)
    return query.all()


def create_test_parameter(db: Session, parameter: TestParameterCreate) -> TestParameter:
    """Create a new test parameter"""
    db_parameter = TestParameter(**parameter.dict())
    db.add(db_parameter)
    db.commit()
    db.refresh(db_parameter)
    return db_parameter
