from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from app.core.database import Base

class Estimation(Base):
    __tablename__ = "estimations"

    id = Column(Integer, primary_key=True, index=True)
    rfqId = Column(Integer, ForeignKey("rfqs.id"), nullable=False)

    estimationId = Column(String, nullable=False)
    version = Column(Integer, default=1)

    totalCost = Column(Float, default=0)
    totalHours = Column(Float, default=0)

    margin = Column(Float, default=0)
    discount = Column(Float, default=0)

    notes = Column(String)
    status = Column(String, default="draft")
    details = Column(JSONB, default={}, nullable=True)

class TestType(Base):
    __tablename__ = "test_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    parentId = Column(Integer, ForeignKey("test_types.id"), nullable=True)
    defaultRate = Column(Float, default=0)
    unit = Column(String, default="per test")
    hsnCode = Column(String, nullable=True)
    description = Column(String, nullable=True)

class EstimationTestItem(Base):
    __tablename__ = "estimation_test_items"

    id = Column(Integer, primary_key=True)
    estimationId = Column(Integer, ForeignKey("estimations.id"))

    testTypeId = Column(Integer, ForeignKey("test_types.id"))
    numberOfDUT = Column(Integer)
    hours = Column(Float)
    ratePerHour = Column(Float)
    remarks = Column(String)
