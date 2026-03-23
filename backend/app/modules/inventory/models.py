"""
Database models for Inventory Management
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class Instrument(Base):
    """Instrument model for lab equipment"""
    __tablename__ = "instruments"

    id = Column(Integer, primary_key=True, index=True)
    instrument_id = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    manufacturer = Column(String(255), nullable=True)
    model = Column(String(255), nullable=True)
    serial_number = Column(String(255), nullable=True)
    lab_location = Column(String(255), nullable=True)
    assigned_department = Column(String(255), nullable=True)
    status = Column(String(50), nullable=False, default="Active")  # Active, Under Maintenance, Out of Service
    purchase_date = Column(Date, nullable=True)
    warranty_expiry = Column(Date, nullable=True)
    service_vendor = Column(String(255), nullable=True)
    service_vendor_contact = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    calibrations = relationship("Calibration", back_populates="instrument", cascade="all, delete-orphan")


class Consumable(Base):
    """Consumable and Accessory model"""
    __tablename__ = "consumables"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(String(50), unique=True, nullable=False, index=True)
    item_name = Column(String(255), nullable=False)
    category = Column(String(50), nullable=True)  # Consumable, Accessory
    quantity_available = Column(Integer, nullable=False, default=0)
    unit = Column(String(50), nullable=True)  # units, liters, kg, etc.
    low_stock_threshold = Column(Integer, nullable=False, default=10)
    batch_lot_number = Column(String(255), nullable=True)
    expiry_date = Column(Date, nullable=True)
    supplier = Column(String(255), nullable=True)
    status = Column(String(50), nullable=True)  # Calculated: In Stock, Low Stock, Out of Stock, Expired, Expiring Soon
    notes = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)


class Calibration(Base):
    """Calibration record for instruments"""
    __tablename__ = "calibrations"

    id = Column(Integer, primary_key=True, index=True)
    calibration_id = Column(String(50), unique=True, nullable=False, index=True)
    instrument_id = Column(Integer, ForeignKey("instruments.id", ondelete="CASCADE"), nullable=False, index=True)
    instrument_name = Column(String(255), nullable=True)  # Denormalized
    last_calibration_date = Column(Date, nullable=False)
    next_due_date = Column(Date, nullable=False)
    calibration_frequency = Column(String(50), nullable=True)  # Monthly, Quarterly, Annually, etc.
    certified_by = Column(String(255), nullable=True)
    certificate_number = Column(String(255), nullable=True)
    status = Column(String(50), nullable=True)  # Calculated: Valid, Due Soon, Overdue
    notes = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    instrument = relationship("Instrument", back_populates="calibrations")


class InventoryTransaction(Base):
    """Inventory transaction for stock movements"""
    __tablename__ = "inventory_transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String(50), unique=True, nullable=False, index=True)
    item_id = Column(Integer, nullable=True)  # Can reference consumables or instruments
    item_name = Column(String(255), nullable=True)
    item_type = Column(String(50), nullable=True)  # Consumable, Instrument
    transaction_type = Column(String(50), nullable=False)  # Usage, Addition, Wastage
    quantity = Column(Integer, nullable=False)
    used_by = Column(String(255), nullable=True)
    date = Column(Date, nullable=False)
    purpose = Column(Text, nullable=True)
    linked_test_id = Column(Integer, nullable=True)  # Optional link to test execution
    linked_test_name = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
