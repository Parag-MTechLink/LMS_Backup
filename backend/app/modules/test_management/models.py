"""
Database models for Test Management
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Float, ForeignKey, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base


class TestType(str, enum.Enum):
    """Test type enumeration"""
    EMC = "EMC"
    RF = "RF"
    SAFETY = "Safety"
    ENVIRONMENTAL = "Environmental"
    SOFTWARE = "Software"
    MECHANICAL = "Mechanical"
    THERMAL = "Thermal"
    OTHER = "Other"


class TestPlanStatus(str, enum.Enum):
    """Test plan status enumeration"""
    DRAFT = "Draft"
    IN_PROGRESS = "InProgress"
    APPROVED = "Approved"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"


class TestExecutionStatus(str, enum.Enum):
    """Test execution status enumeration"""
    PENDING = "Pending"
    IN_PROGRESS = "InProgress"
    COMPLETED = "Completed"
    FAILED = "Failed"
    CANCELLED = "Cancelled"


class TestPlan(Base):
    """Test Plan model"""
    __tablename__ = "test_plans"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, nullable=True, index=True)  # Foreign key to projects (if exists)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    test_type = Column(SQLEnum(TestType), nullable=False, default=TestType.EMC)
    status = Column(SQLEnum(TestPlanStatus), nullable=False, default=TestPlanStatus.DRAFT)
    
    # Engineer assignment
    assigned_engineer_id = Column(Integer, nullable=True)  # Foreign key to users
    assigned_engineer_name = Column(String(255), nullable=True)  # Denormalized for quick access
    
    # Project info (denormalized)
    project_name = Column(String(255), nullable=True)
    
    # Dates
    planned_start_date = Column(DateTime, nullable=True)
    planned_end_date = Column(DateTime, nullable=True)
    actual_start_date = Column(DateTime, nullable=True)
    actual_end_date = Column(DateTime, nullable=True)
    
    # Metadata
    created_by = Column(Integer, nullable=True)  # Foreign key to users
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    executions = relationship("TestExecution", back_populates="test_plan", cascade="all, delete-orphan")


class TestExecution(Base):
    """Test Execution model"""
    __tablename__ = "test_executions"

    id = Column(Integer, primary_key=True, index=True)
    test_plan_id = Column(Integer, ForeignKey("test_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    execution_number = Column(Integer, nullable=False)  # Auto-increment per test plan
    
    status = Column(SQLEnum(TestExecutionStatus), nullable=False, default=TestExecutionStatus.PENDING)
    
    # Executor info
    executed_by_id = Column(Integer, nullable=True)  # Foreign key to users
    executed_by_name = Column(String(255), nullable=True)  # Denormalized
    
    # Timing
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    
    # Test conditions
    environment_conditions = Column(JSON, nullable=True)  # {temperature, humidity, pressure, etc.}
    instruments_used = Column(JSON, nullable=True)  # Array of instrument IDs
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    test_plan = relationship("TestPlan", back_populates="executions")
    results = relationship("TestResult", back_populates="test_execution", cascade="all, delete-orphan")


class TestResult(Base):
    """Test Result model"""
    __tablename__ = "test_results"

    id = Column(Integer, primary_key=True, index=True)
    test_execution_id = Column(Integer, ForeignKey("test_executions.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Test details
    test_parameter = Column(String(255), nullable=False)
    expected_value = Column(String(255), nullable=True)
    actual_value = Column(String(255), nullable=True)
    pass_fail = Column(Boolean, nullable=False)
    measurement_unit = Column(String(50), nullable=True)
    
    # Test metadata
    test_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    test_type = Column(String(100), nullable=True)
    deviation_percentage = Column(Float, nullable=True)
    
    # Additional info
    remarks = Column(Text, nullable=True)
    attachments = Column(JSON, nullable=True)  # Array of file paths/URLs
    
    # Review
    reviewed_by_id = Column(Integer, nullable=True)  # Foreign key to users
    reviewed_by_name = Column(String(255), nullable=True)  # Denormalized
    reviewed_at = Column(DateTime, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    test_execution = relationship("TestExecution", back_populates="results")


class TestPlanTemplate(Base):
    """Test Plan Template model for reusable test plans"""
    __tablename__ = "test_plan_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    test_type = Column(SQLEnum(TestType), nullable=False)
    description = Column(Text, nullable=True)
    template_data = Column(JSON, nullable=False)  # Contains test parameters, procedures, etc.
    is_active = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class TestParameter(Base):
    """Standard test parameters for different test types"""
    __tablename__ = "test_parameters"

    id = Column(Integer, primary_key=True, index=True)
    test_type = Column(SQLEnum(TestType), nullable=False, index=True)
    parameter_name = Column(String(255), nullable=False)
    unit = Column(String(50), nullable=True)
    acceptable_range = Column(String(255), nullable=True)  # e.g., "0-100", ">50", etc.
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
