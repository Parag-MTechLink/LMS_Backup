"""
Pydantic schemas for Test Management
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class TestTypeEnum(str, Enum):
    """Test type enumeration"""
    EMC = "EMC"
    RF = "RF"
    SAFETY = "Safety"
    ENVIRONMENTAL = "Environmental"
    SOFTWARE = "Software"
    MECHANICAL = "Mechanical"
    THERMAL = "Thermal"
    OTHER = "Other"


class TestPlanStatusEnum(str, Enum):
    """Test plan status enumeration"""
    DRAFT = "Draft"
    IN_PROGRESS = "InProgress"
    APPROVED = "Approved"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"


class TestExecutionStatusEnum(str, Enum):
    """Test execution status enumeration"""
    PENDING = "Pending"
    IN_PROGRESS = "InProgress"
    COMPLETED = "Completed"
    FAILED = "Failed"
    CANCELLED = "Cancelled"


# Test Plan Schemas
class TestPlanBase(BaseModel):
    """Base test plan schema"""
    name: str
    description: Optional[str] = None
    test_type: TestTypeEnum = Field(..., alias="testType")
    project_id: Optional[int] = Field(None, alias="projectId")
    project_name: Optional[str] = Field(None, alias="projectName")
    assigned_engineer_id: Optional[int] = Field(None, alias="assignedEngineerId")
    assigned_engineer_name: Optional[str] = Field(None, alias="assignedEngineerName")
    planned_start_date: Optional[datetime] = Field(None, alias="plannedStartDate")
    planned_end_date: Optional[datetime] = Field(None, alias="plannedEndDate")

    class Config:
        populate_by_name = True


class TestPlanCreate(TestPlanBase):
    """Schema for creating a test plan"""
    pass


class TestPlanUpdate(BaseModel):
    """Schema for updating a test plan"""
    name: Optional[str] = None
    description: Optional[str] = None
    test_type: Optional[TestTypeEnum] = Field(None, alias="testType")
    status: Optional[TestPlanStatusEnum] = None
    project_id: Optional[int] = Field(None, alias="projectId")
    project_name: Optional[str] = Field(None, alias="projectName")
    assigned_engineer_id: Optional[int] = Field(None, alias="assignedEngineerId")
    assigned_engineer_name: Optional[str] = Field(None, alias="assignedEngineerName")
    planned_start_date: Optional[datetime] = Field(None, alias="plannedStartDate")
    planned_end_date: Optional[datetime] = Field(None, alias="plannedEndDate")

    class Config:
        populate_by_name = True


class TestPlanResponse(BaseModel):
    """Schema for test plan response"""
    id: int
    name: str
    description: Optional[str] = None
    test_type: TestTypeEnum = Field(..., alias="testType")
    status: TestPlanStatusEnum
    project_id: Optional[int] = Field(None, alias="projectId")
    project_name: Optional[str] = Field(None, alias="projectName")
    assigned_engineer_id: Optional[int] = Field(None, alias="assignedEngineerId")
    assigned_engineer_name: Optional[str] = Field(None, alias="assignedEngineerName")
    planned_start_date: Optional[datetime] = Field(None, alias="plannedStartDate")
    planned_end_date: Optional[datetime] = Field(None, alias="plannedEndDate")
    created_by: Optional[int] = Field(None, alias="createdBy")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")
    is_deleted: bool = Field(..., alias="isDeleted")

    class Config:
        from_attributes = True
        populate_by_name = True


# Test Execution Schemas
class TestExecutionBase(BaseModel):
    """Base test execution schema"""
    test_plan_id: int = Field(..., alias="testPlanId")
    executed_by_id: Optional[int] = Field(None, alias="executedById")
    executed_by_name: Optional[str] = Field(None, alias="executedByName")
    start_time: Optional[datetime] = Field(None, alias="startTime")
    end_time: Optional[datetime] = Field(None, alias="endTime")
    environment_conditions: Optional[Dict[str, Any]] = Field(None, alias="environmentConditions")
    instruments_used: Optional[List[int]] = Field(None, alias="instrumentsUsed")
    notes: Optional[str] = None

    class Config:
        populate_by_name = True


class TestExecutionCreate(TestExecutionBase):
    """Schema for creating a test execution"""
    pass


class TestExecutionUpdate(BaseModel):
    """Schema for updating a test execution"""
    status: Optional[TestExecutionStatusEnum] = None
    executed_by_id: Optional[int] = None
    executed_by_name: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    environment_conditions: Optional[Dict[str, Any]] = None
    instruments_used: Optional[List[int]] = None
    notes: Optional[str] = None


class TestExecutionResponse(BaseModel):
    """Schema for test execution response"""
    id: int
    test_plan_id: int = Field(..., alias="testPlanId")
    execution_number: int = Field(..., alias="executionNumber")
    status: TestExecutionStatusEnum
    executed_by_id: Optional[int] = Field(None, alias="executedById")
    executed_by_name: Optional[str] = Field(None, alias="executedByName")
    start_time: Optional[datetime] = Field(None, alias="startTime")
    end_time: Optional[datetime] = Field(None, alias="endTime")
    environment_conditions: Optional[Dict[str, Any]] = Field(None, alias="environmentConditions")
    instruments_used: Optional[List[int]] = Field(None, alias="instrumentsUsed")
    notes: Optional[str] = None
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")
    is_deleted: bool = Field(..., alias="isDeleted")

    class Config:
        from_attributes = True
        populate_by_name = True


# Test Result Schemas
class TestResultBase(BaseModel):
    """Base test result schema"""
    test_execution_id: int = Field(..., alias="testExecutionId")
    test_parameter: str = Field(..., min_length=1, max_length=255, alias="testParameter")
    expected_value: Optional[str] = Field(None, alias="expectedValue")
    actual_value: Optional[str] = Field(None, alias="actualValue")
    pass_fail: bool = Field(..., alias="passFail")
    measurement_unit: Optional[str] = Field(None, alias="measurementUnit")
    test_type: Optional[str] = Field(None, alias="testType")
    deviation_percentage: Optional[float] = Field(None, alias="deviationPercentage")
    remarks: Optional[str] = None
    attachments: Optional[List[str]] = None

    class Config:
        populate_by_name = True


class TestResultCreate(TestResultBase):
    """Schema for creating a test result"""
    test_date: Optional[datetime] = None


class TestResultUpdate(BaseModel):
    """Schema for updating a test result"""
    test_parameter: Optional[str] = Field(None, min_length=1, max_length=255, alias="testParameter")
    expected_value: Optional[str] = Field(None, alias="expectedValue")
    actual_value: Optional[str] = Field(None, alias="actualValue")
    pass_fail: Optional[bool] = Field(None, alias="passFail")
    measurement_unit: Optional[str] = Field(None, alias="measurementUnit")
    test_type: Optional[str] = None
    deviation_percentage: Optional[float] = None
    remarks: Optional[str] = None
    attachments: Optional[List[str]] = None
    test_date: Optional[datetime] = None


class TestResultReview(BaseModel):
    """Schema for reviewing a test result"""
    reviewed_by_id: int
    reviewed_by_name: str
    remarks: Optional[str] = None


class TestResultResponse(BaseModel):
    """Schema for test result response"""
    id: int
    test_execution_id: int = Field(..., alias="testExecutionId")
    test_parameter: str = Field(..., alias="testParameter")
    expected_value: Optional[str] = Field(None, alias="expectedValue")
    actual_value: Optional[str] = Field(None, alias="actualValue")
    pass_fail: bool = Field(..., alias="passFail")
    measurement_unit: Optional[str] = Field(None, alias="measurementUnit")
    test_type: Optional[str] = Field(None, alias="testType")
    test_date: datetime = Field(..., alias="testDate")
    deviation_percentage: Optional[float] = Field(None, alias="deviationPercentage")
    remarks: Optional[str] = None
    attachments: Optional[List[str]] = None
    reviewed_by_id: Optional[int] = Field(None, alias="reviewedById")
    reviewed_by_name: Optional[str] = Field(None, alias="reviewedByName")
    reviewed_at: Optional[datetime] = Field(None, alias="reviewedAt")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")

    class Config:
        from_attributes = True
        populate_by_name = True


# Test Plan Template Schemas
class TestPlanTemplateBase(BaseModel):
    """Base test plan template schema"""
    name: str = Field(..., min_length=1, max_length=255)
    test_type: TestTypeEnum
    description: Optional[str] = None
    template_data: Dict[str, Any]


class TestPlanTemplateCreate(TestPlanTemplateBase):
    """Schema for creating a test plan template"""
    pass


class TestPlanTemplateResponse(TestPlanTemplateBase):
    """Schema for test plan template response"""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Test Parameter Schemas
class TestParameterBase(BaseModel):
    """Base test parameter schema"""
    test_type: TestTypeEnum
    parameter_name: str = Field(..., min_length=1, max_length=255)
    unit: Optional[str] = None
    acceptable_range: Optional[str] = None
    description: Optional[str] = None


class TestParameterCreate(TestParameterBase):
    """Schema for creating a test parameter"""
    pass


class TestParameterResponse(TestParameterBase):
    """Schema for test parameter response"""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Statistics Schemas
class TestResultStatistics(BaseModel):
    """Schema for test result statistics"""
    total_results: int
    passed: int
    failed: int
    pass_rate: float
    by_test_type: Dict[str, Dict[str, int]]
