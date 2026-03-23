"""
Pydantic schemas for Inventory Management
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date


# Instrument Schemas
class InstrumentBase(BaseModel):
    """Base instrument schema"""
    instrument_id: str = Field(..., alias="instrumentId")
    name: str
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = Field(None, alias="serialNumber")
    lab_location: Optional[str] = Field(None, alias="labLocation")
    assigned_department: Optional[str] = Field(None, alias="assignedDepartment")
    status: str = "Active"
    purchase_date: Optional[date] = Field(None, alias="purchaseDate")
    warranty_expiry: Optional[date] = Field(None, alias="warrantyExpiry")
    service_vendor: Optional[str] = Field(None, alias="serviceVendor")
    service_vendor_contact: Optional[str] = Field(None, alias="serviceVendorContact")
    notes: Optional[str] = None

    class Config:
        populate_by_name = True


class InstrumentCreate(InstrumentBase):
    """Schema for creating an instrument"""
    pass


class InstrumentUpdate(BaseModel):
    """Schema for updating an instrument"""
    instrument_id: Optional[str] = Field(None, alias="instrumentId")
    name: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = Field(None, alias="serialNumber")
    lab_location: Optional[str] = Field(None, alias="labLocation")
    assigned_department: Optional[str] = Field(None, alias="assignedDepartment")
    status: Optional[str] = None
    purchase_date: Optional[date] = Field(None, alias="purchaseDate")
    warranty_expiry: Optional[date] = Field(None, alias="warrantyExpiry")
    service_vendor: Optional[str] = Field(None, alias="serviceVendor")
    service_vendor_contact: Optional[str] = Field(None, alias="serviceVendorContact")
    notes: Optional[str] = None

    class Config:
        populate_by_name = True


class InstrumentResponse(BaseModel):
    """Schema for instrument response"""
    id: int
    instrument_id: str = Field(..., alias="instrumentId")
    name: str
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = Field(None, alias="serialNumber")
    lab_location: Optional[str] = Field(None, alias="labLocation")
    assigned_department: Optional[str] = Field(None, alias="assignedDepartment")
    status: str
    purchase_date: Optional[date] = Field(None, alias="purchaseDate")
    warranty_expiry: Optional[date] = Field(None, alias="warrantyExpiry")
    service_vendor: Optional[str] = Field(None, alias="serviceVendor")
    service_vendor_contact: Optional[str] = Field(None, alias="serviceVendorContact")
    notes: Optional[str] = None
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")
    is_deleted: bool = Field(..., alias="isDeleted")

    class Config:
        from_attributes = True
        populate_by_name = True


# Consumable Schemas
class ConsumableBase(BaseModel):
    """Base consumable schema"""
    item_id: str = Field(..., alias="itemId")
    item_name: str = Field(..., alias="itemName")
    category: Optional[str] = None
    quantity_available: int = Field(0, alias="quantityAvailable")
    unit: Optional[str] = None
    low_stock_threshold: int = Field(10, alias="lowStockThreshold")
    batch_lot_number: Optional[str] = Field(None, alias="batchLotNumber")
    expiry_date: Optional[date] = Field(None, alias="expiryDate")
    supplier: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        populate_by_name = True


class ConsumableCreate(ConsumableBase):
    """Schema for creating a consumable"""
    pass


class ConsumableUpdate(BaseModel):
    """Schema for updating a consumable"""
    item_id: Optional[str] = Field(None, alias="itemId")
    item_name: Optional[str] = Field(None, alias="itemName")
    category: Optional[str] = None
    quantity_available: Optional[int] = Field(None, alias="quantityAvailable")
    unit: Optional[str] = None
    low_stock_threshold: Optional[int] = Field(None, alias="lowStockThreshold")
    batch_lot_number: Optional[str] = Field(None, alias="batchLotNumber")
    expiry_date: Optional[date] = Field(None, alias="expiryDate")
    supplier: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        populate_by_name = True


class ConsumableResponse(BaseModel):
    """Schema for consumable response"""
    id: int
    item_id: str = Field(..., alias="itemId")
    item_name: str = Field(..., alias="itemName")
    category: Optional[str] = None
    quantity_available: int = Field(..., alias="quantityAvailable")
    unit: Optional[str] = None
    low_stock_threshold: int = Field(..., alias="lowStockThreshold")
    batch_lot_number: Optional[str] = Field(None, alias="batchLotNumber")
    expiry_date: Optional[date] = Field(None, alias="expiryDate")
    supplier: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")
    is_deleted: bool = Field(..., alias="isDeleted")

    class Config:
        from_attributes = True
        populate_by_name = True


# Calibration Schemas
class CalibrationBase(BaseModel):
    """Base calibration schema"""
    calibration_id: str = Field(..., alias="calibrationId")
    instrument_id: int = Field(..., alias="instrumentId")
    last_calibration_date: date = Field(..., alias="lastCalibrationDate")
    next_due_date: date = Field(..., alias="nextDueDate")
    calibration_frequency: Optional[str] = Field(None, alias="calibrationFrequency")
    certified_by: Optional[str] = Field(None, alias="certifiedBy")
    certificate_number: Optional[str] = Field(None, alias="certificateNumber")
    notes: Optional[str] = None

    class Config:
        populate_by_name = True


class CalibrationCreate(CalibrationBase):
    """Schema for creating a calibration"""
    pass


class CalibrationUpdate(BaseModel):
    """Schema for updating a calibration"""
    calibration_id: Optional[str] = Field(None, alias="calibrationId")
    instrument_id: Optional[int] = Field(None, alias="instrumentId")
    last_calibration_date: Optional[date] = Field(None, alias="lastCalibrationDate")
    next_due_date: Optional[date] = Field(None, alias="nextDueDate")
    calibration_frequency: Optional[str] = Field(None, alias="calibrationFrequency")
    certified_by: Optional[str] = Field(None, alias="certifiedBy")
    certificate_number: Optional[str] = Field(None, alias="certificateNumber")
    notes: Optional[str] = None

    class Config:
        populate_by_name = True


class CalibrationResponse(BaseModel):
    """Schema for calibration response"""
    id: int
    calibration_id: str = Field(..., alias="calibrationId")
    instrument_id: int = Field(..., alias="instrumentId")
    instrument_name: Optional[str] = Field(None, alias="instrumentName")
    last_calibration_date: date = Field(..., alias="lastCalibrationDate")
    next_due_date: date = Field(..., alias="nextDueDate")
    calibration_frequency: Optional[str] = Field(None, alias="calibrationFrequency")
    certified_by: Optional[str] = Field(None, alias="certifiedBy")
    certificate_number: Optional[str] = Field(None, alias="certificateNumber")
    status: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")
    is_deleted: bool = Field(..., alias="isDeleted")

    class Config:
        from_attributes = True
        populate_by_name = True


# Transaction Schemas
class TransactionBase(BaseModel):
    """Base transaction schema"""
    transaction_id: str = Field(..., alias="transactionId")
    item_id: Optional[int] = Field(None, alias="itemId")
    item_name: Optional[str] = Field(None, alias="itemName")
    item_type: Optional[str] = Field(None, alias="itemType")
    transaction_type: str = Field(..., alias="transactionType")
    quantity: int
    used_by: Optional[str] = Field(None, alias="usedBy")
    date: date
    purpose: Optional[str] = None
    linked_test_id: Optional[int] = Field(None, alias="linkedTestId")
    linked_test_name: Optional[str] = Field(None, alias="linkedTestName")
    notes: Optional[str] = None

    class Config:
        populate_by_name = True


class TransactionCreate(TransactionBase):
    """Schema for creating a transaction"""
    pass


class TransactionResponse(BaseModel):
    """Schema for transaction response"""
    id: int
    transaction_id: str = Field(..., alias="transactionId")
    item_id: Optional[int] = Field(None, alias="itemId")
    item_name: Optional[str] = Field(None, alias="itemName")
    item_type: Optional[str] = Field(None, alias="itemType")
    transaction_type: str = Field(..., alias="transactionType")
    quantity: int
    used_by: Optional[str] = Field(None, alias="usedBy")
    date: date
    purpose: Optional[str] = None
    linked_test_id: Optional[int] = Field(None, alias="linkedTestId")
    linked_test_name: Optional[str] = Field(None, alias="linkedTestName")
    notes: Optional[str] = None
    created_at: datetime = Field(..., alias="createdAt")
    is_deleted: bool = Field(..., alias="isDeleted")

    class Config:
        from_attributes = True
        populate_by_name = True
