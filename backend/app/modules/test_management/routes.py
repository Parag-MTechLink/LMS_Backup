"""
API routes for Test Management
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.dependencies.auth_dependency import require_roles, require_permission
from app.models.user_model import User
from app.services.rbac_service import log_audit
from . import crud, schemas


router = APIRouter()


# Test Plan Routes
@router.get("/test-plans", response_model=List[schemas.TestPlanResponse], tags=["Test Plans"])
def list_test_plans(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    project_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    test_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("testplan:view"))
):
    """Get all test plans with optional filtering"""
    return crud.get_test_plans(db, skip=skip, limit=limit, project_id=project_id, 
                               status=status, test_type=test_type, search=search)


@router.get("/test-plans/{test_plan_id}", response_model=schemas.TestPlanResponse, tags=["Test Plans"])
def get_test_plan(
    test_plan_id: int, 
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("testplan:view"))
):
    """Get a specific test plan"""
    test_plan = crud.get_test_plan(db, test_plan_id)
    if not test_plan:
        raise HTTPException(status_code=404, detail="Test plan not found")
    return test_plan


@router.post("/test-plans", response_model=schemas.TestPlanResponse, status_code=201, tags=["Test Plans"])
def create_test_plan(
    test_plan: schemas.TestPlanCreate, 
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("testplan:full"))
):
    """Create a new test plan"""
    return crud.create_test_plan(db, test_plan)


@router.put("/test-plans/{test_plan_id}", response_model=schemas.TestPlanResponse, tags=["Test Plans"])
def update_test_plan(
    test_plan_id: int, 
    test_plan: schemas.TestPlanUpdate, 
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("testplan:full"))
):
    """Update a test plan"""
    updated_plan = crud.update_test_plan(db, test_plan_id, test_plan)
    if not updated_plan:
        raise HTTPException(status_code=404, detail="Test plan not found")
    return updated_plan


@router.delete("/test-plans/{test_plan_id}", status_code=204, tags=["Test Plans"])
def delete_test_plan(
    test_plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin")),
):
    """Delete a test plan (Admin only). Audit logged."""
    success = crud.delete_test_plan(db, test_plan_id)
    if not success:
        raise HTTPException(status_code=404, detail="Test plan not found")
    log_audit(db, current_user.id, "test_plan.delete", "test_plan", str(test_plan_id), details={"role": current_user.role})
    db.commit()
    return None


@router.post("/test-plans/{test_plan_id}/approve", response_model=schemas.TestPlanResponse, tags=["Test Plans"])
def approve_test_plan(
    test_plan_id: int, 
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("testplan:full"))
):
    """Approve a test plan"""
    approved_plan = crud.approve_test_plan(db, test_plan_id)
    if not approved_plan:
        raise HTTPException(status_code=404, detail="Test plan not found")
    return approved_plan


@router.get("/test-plans/{test_plan_id}/executions", response_model=List[schemas.TestExecutionResponse], tags=["Test Plans"])
def get_test_plan_executions(test_plan_id: int, db: Session = Depends(get_db)):
    """Get all executions for a test plan"""
    return crud.get_test_executions(db, test_plan_id=test_plan_id)


@router.get("/test-plan-templates", response_model=List[schemas.TestPlanTemplateResponse], tags=["Test Plans"])
def list_test_plan_templates(
    test_type: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all test plan templates"""
    return crud.get_test_plan_templates(db, test_type=test_type)


# Test Execution Routes
@router.get("/test-executions", response_model=List[schemas.TestExecutionResponse], tags=["Test Executions"])
def list_test_executions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    test_plan_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("testexecution:view"))
):
    """Get all test executions with optional filtering"""
    return crud.get_test_executions(db, skip=skip, limit=limit, 
                                   test_plan_id=test_plan_id, status=status)


@router.get("/test-executions/{execution_id}", response_model=schemas.TestExecutionResponse, tags=["Test Executions"])
def get_test_execution(
    execution_id: int, 
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("testexecution:view"))
):
    """Get a specific test execution"""
    execution = crud.get_test_execution(db, execution_id)
    if not execution:
        raise HTTPException(status_code=404, detail="Test execution not found")
    return execution


@router.post("/test-executions", response_model=schemas.TestExecutionResponse, status_code=201, tags=["Test Executions"])
def create_test_execution(
    execution: schemas.TestExecutionCreate, 
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("testexecution:full"))
):
    """Create a new test execution"""
    # Verify test plan exists
    test_plan = crud.get_test_plan(db, execution.test_plan_id)
    if not test_plan:
        raise HTTPException(status_code=404, detail="Test plan not found")
    return crud.create_test_execution(db, execution)


@router.put("/test-executions/{execution_id}", response_model=schemas.TestExecutionResponse, tags=["Test Executions"])
def update_test_execution(
    execution_id: int, 
    execution: schemas.TestExecutionUpdate, 
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("testexecution:full"))
):
    """Update a test execution"""
    updated_execution = crud.update_test_execution(db, execution_id, execution)
    if not updated_execution:
        raise HTTPException(status_code=404, detail="Test execution not found")
    return updated_execution


@router.delete("/test-executions/{execution_id}", status_code=204, tags=["Test Executions"])
def delete_test_execution(
    execution_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin")),
):
    """Delete a test execution (Admin only). Audit logged."""
    success = crud.delete_test_execution(db, execution_id)
    if not success:
        raise HTTPException(status_code=404, detail="Test execution not found")
    log_audit(db, current_user.id, "test_execution.delete", "test_execution", str(execution_id), details={"role": current_user.role})
    db.commit()
    return None


@router.post("/test-executions/{execution_id}/start", response_model=schemas.TestExecutionResponse, tags=["Test Executions"])
def start_test_execution(execution_id: int, db: Session = Depends(get_db)):
    """Start a test execution"""
    started_execution = crud.start_test_execution(db, execution_id)
    if not started_execution:
        raise HTTPException(status_code=404, detail="Test execution not found")
    return started_execution


@router.post("/test-executions/{execution_id}/complete", response_model=schemas.TestExecutionResponse, tags=["Test Executions"])
def complete_test_execution(execution_id: int, db: Session = Depends(get_db)):
    """Complete a test execution"""
    completed_execution = crud.complete_test_execution(db, execution_id)
    if not completed_execution:
        raise HTTPException(status_code=404, detail="Test execution not found")
    return completed_execution


@router.get("/test-executions/{execution_id}/results", response_model=List[schemas.TestResultResponse], tags=["Test Executions"])
def get_execution_results(execution_id: int, db: Session = Depends(get_db)):
    """Get all results for a test execution"""
    return crud.get_test_results(db, execution_id=execution_id)


# Test Result Routes
@router.get("/test-results", response_model=List[schemas.TestResultResponse], tags=["Test Results"])
def list_test_results(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    execution_id: Optional[int] = Query(None),
    pass_fail: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("testresult:view"))
):
    """Get all test results with optional filtering"""
    return crud.get_test_results(db, skip=skip, limit=limit, 
                                 execution_id=execution_id, pass_fail=pass_fail)


@router.get("/test-results/{result_id}", response_model=schemas.TestResultResponse, tags=["Test Results"])
def get_test_result(
    result_id: int, 
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("testresult:view"))
):
    """Get a specific test result"""
    result = crud.get_test_result(db, result_id)
    if not result:
        raise HTTPException(status_code=404, detail="Test result not found")
    return result


@router.post("/test-results", response_model=schemas.TestResultResponse, status_code=201, tags=["Test Results"])
def create_test_result(
    result: schemas.TestResultCreate, 
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("testresult:full"))
):
    """Create a new test result"""
    # Verify test execution exists
    execution = crud.get_test_execution(db, result.test_execution_id)
    if not execution:
        raise HTTPException(status_code=404, detail="Test execution not found")
    return crud.create_test_result(db, result)


@router.put("/test-results/{result_id}", response_model=schemas.TestResultResponse, tags=["Test Results"])
def update_test_result(result_id: int, result: schemas.TestResultUpdate, db: Session = Depends(get_db)):
    """Update a test result"""
    updated_result = crud.update_test_result(db, result_id, result)
    if not updated_result:
        raise HTTPException(status_code=404, detail="Test result not found")
    return updated_result


@router.delete("/test-results/{result_id}", status_code=204, tags=["Test Results"])
def delete_test_result(
    result_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin")),
):
    """Delete a test result (Admin only). Audit logged."""
    success = crud.delete_test_result(db, result_id)
    if not success:
        raise HTTPException(status_code=404, detail="Test result not found")
    log_audit(db, current_user.id, "test_result.delete", "test_result", str(result_id), details={"role": current_user.role})
    db.commit()
    return None


@router.post("/test-results/{result_id}/review", response_model=schemas.TestResultResponse, tags=["Test Results"])
def review_test_result(result_id: int, review: schemas.TestResultReview, db: Session = Depends(get_db)):
    """Review a test result"""
    reviewed_result = crud.review_test_result(db, result_id, review)
    if not reviewed_result:
        raise HTTPException(status_code=404, detail="Test result not found")
    return reviewed_result


@router.get("/test-results/statistics", response_model=schemas.TestResultStatistics, tags=["Test Results"])
def get_test_result_statistics(
    execution_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Get test result statistics"""
    return crud.get_test_result_statistics(db, execution_id=execution_id)


# Test Parameter Routes
@router.get("/test-parameters", response_model=List[schemas.TestParameterResponse], tags=["Test Parameters"])
def list_test_parameters(
    test_type: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all test parameters"""
    return crud.get_test_parameters(db, test_type=test_type)
