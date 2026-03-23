"""
CRUD operations for Inventory Management
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import date, timedelta, datetime

from .models import Instrument, Consumable, Calibration, InventoryTransaction
from .schemas import (
    InstrumentCreate, InstrumentUpdate,
    ConsumableCreate, ConsumableUpdate,
    CalibrationCreate, CalibrationUpdate,
    TransactionCreate
)


# Helper functions for status calculations
def calculate_consumable_status(consumable: Consumable) -> str:
    """Calculate consumable status based on quantity and expiry"""
    if consumable.quantity_available == 0:
        return "Out of Stock"
    elif consumable.quantity_available <= consumable.low_stock_threshold:
        return "Low Stock"
    elif consumable.expiry_date:
        days_until_expiry = (consumable.expiry_date - date.today()).days
        if days_until_expiry < 0:
            return "Expired"
        elif days_until_expiry <= 30:
            return "Expiring Soon"
    return "In Stock"


def calculate_calibration_status(calibration: Calibration) -> str:
    """Calculate calibration status based on due date"""
    days_until_due = (calibration.next_due_date - date.today()).days
    if days_until_due < 0:
        return "Overdue"
    elif days_until_due <= 30:
        return "Due Soon"
    return "Valid"


# Instrument CRUD
def get_instruments(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    department: Optional[str] = None,
    search: Optional[str] = None
) -> List[Instrument]:
    """Get all instruments with optional filtering"""
    query = db.query(Instrument).filter(Instrument.is_deleted == False)
    
    if status:
        query = query.filter(Instrument.status == status)
    if department:
        query = query.filter(Instrument.assigned_department == department)
    if search:
        search_filter = or_(
            Instrument.instrument_id.ilike(f"%{search}%"),
            Instrument.name.ilike(f"%{search}%"),
            Instrument.manufacturer.ilike(f"%{search}%"),
            Instrument.model.ilike(f"%{search}%"),
            Instrument.serial_number.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    return query.order_by(Instrument.created_at.desc()).offset(skip).limit(limit).all()


def get_instrument(db: Session, instrument_id: int) -> Optional[Instrument]:
    """Get a specific instrument by ID"""
    return db.query(Instrument).filter(
        and_(Instrument.id == instrument_id, Instrument.is_deleted == False)
    ).first()


def create_instrument(db: Session, instrument: InstrumentCreate) -> Instrument:
    """Create a new instrument"""
    db_instrument = Instrument(**instrument.model_dump(by_alias=False))
    db.add(db_instrument)
    db.commit()
    db.refresh(db_instrument)
    return db_instrument


def update_instrument(db: Session, instrument_id: int, instrument: InstrumentUpdate) -> Optional[Instrument]:
    """Update an instrument and sync denormalized names"""
    db_instrument = get_instrument(db, instrument_id)
    if not db_instrument:
        return None
    
    old_name = db_instrument.name
    update_data = instrument.model_dump(exclude_unset=True, by_alias=False)
    
    for field, value in update_data.items():
        setattr(db_instrument, field, value)
    
    # Sync denormalized name if it changed
    new_name = db_instrument.name
    if old_name != new_name:
        # Update calibrations
        db.query(Calibration).filter(Calibration.instrument_id == instrument_id).update({"instrument_name": new_name})
        # Update transactions
        db.query(InventoryTransaction).filter(
            and_(InventoryTransaction.item_id == instrument_id, InventoryTransaction.item_type == "Instrument")
        ).update({"item_name": new_name})
    
    db.commit()
    db.refresh(db_instrument)
    return db_instrument


def delete_instrument(db: Session, instrument_id: int) -> bool:
    """Soft delete an instrument"""
    db_instrument = get_instrument(db, instrument_id)
    if not db_instrument:
        return False
    
    db_instrument.is_deleted = True
    db.commit()
    return True


# Consumable CRUD
def get_consumables(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    search: Optional[str] = None
) -> List[Consumable]:
    """Get all consumables with optional filtering"""
    query = db.query(Consumable).filter(Consumable.is_deleted == False)
    
    if category:
        query = query.filter(Consumable.category == category)
    if search:
        search_filter = or_(
            Consumable.item_id.ilike(f"%{search}%"),
            Consumable.item_name.ilike(f"%{search}%"),
            Consumable.batch_lot_number.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    consumables = query.order_by(Consumable.created_at.desc()).offset(skip).limit(limit).all()
    
    # Calculate status for each consumable
    for consumable in consumables:
        consumable.status = calculate_consumable_status(consumable)
    
    return consumables


def get_consumable(db: Session, consumable_id: int) -> Optional[Consumable]:
    """Get a specific consumable by ID"""
    consumable = db.query(Consumable).filter(
        and_(Consumable.id == consumable_id, Consumable.is_deleted == False)
    ).first()
    
    if consumable:
        consumable.status = calculate_consumable_status(consumable)
    
    return consumable


def create_consumable(db: Session, consumable: ConsumableCreate) -> Consumable:
    """Create a new consumable"""
    db_consumable = Consumable(**consumable.model_dump(by_alias=False))
    db_consumable.status = calculate_consumable_status(db_consumable)
    db.add(db_consumable)
    db.commit()
    db.refresh(db_consumable)
    return db_consumable


def update_consumable(db: Session, consumable_id: int, consumable: ConsumableUpdate) -> Optional[Consumable]:
    """Update a consumable and sync denormalized names"""
    db_consumable = get_consumable(db, consumable_id)
    if not db_consumable:
        return None
    
    old_name = db_consumable.item_name
    update_data = consumable.model_dump(exclude_unset=True, by_alias=False)
    
    for field, value in update_data.items():
        setattr(db_consumable, field, value)
    
    # Sync denormalized name if it changed
    new_name = db_consumable.item_name
    if old_name != new_name:
        # Update transactions
        db.query(InventoryTransaction).filter(
            and_(InventoryTransaction.item_id == consumable_id, InventoryTransaction.item_type == "Consumable")
        ).update({"item_name": new_name})
    
    db_consumable.status = calculate_consumable_status(db_consumable)
    db.commit()
    db.refresh(db_consumable)
    return db_consumable


def delete_consumable(db: Session, consumable_id: int) -> bool:
    """Soft delete a consumable"""
    db_consumable = get_consumable(db, consumable_id)
    if not db_consumable:
        return False
    
    db_consumable.is_deleted = True
    db.commit()
    return True


# Calibration CRUD
def get_calibrations(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    instrument_id: Optional[int] = None,
    search: Optional[str] = None
) -> List[Calibration]:
    """Get all calibrations with optional filtering"""
    query = db.query(Calibration).filter(Calibration.is_deleted == False)
    
    if instrument_id:
        query = query.filter(Calibration.instrument_id == instrument_id)
    if search:
        search_filter = or_(
            Calibration.calibration_id.ilike(f"%{search}%"),
            Calibration.instrument_name.ilike(f"%{search}%"),
            Calibration.certified_by.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    calibrations = query.order_by(Calibration.created_at.desc()).offset(skip).limit(limit).all()
    
    # Calculate status for each calibration
    for calibration in calibrations:
        calibration.status = calculate_calibration_status(calibration)
    
    return calibrations


def get_calibration(db: Session, calibration_id: int) -> Optional[Calibration]:
    """Get a specific calibration by ID"""
    calibration = db.query(Calibration).filter(
        and_(Calibration.id == calibration_id, Calibration.is_deleted == False)
    ).first()
    
    if calibration:
        calibration.status = calculate_calibration_status(calibration)
    
    return calibration


def create_calibration(db: Session, calibration: CalibrationCreate) -> Calibration:
    """Create a new calibration"""
    # Get instrument name for denormalization
    instrument = get_instrument(db, calibration.instrument_id)
    instrument_name = instrument.name if instrument else None
    
    calibration_data = calibration.model_dump(by_alias=False)
    db_calibration = Calibration(**calibration_data, instrument_name=instrument_name)
    db_calibration.status = calculate_calibration_status(db_calibration)
    
    db.add(db_calibration)
    db.commit()
    db.refresh(db_calibration)
    return db_calibration


def update_calibration(db: Session, calibration_id: int, calibration: CalibrationUpdate) -> Optional[Calibration]:
    """Update a calibration"""
    db_calibration = get_calibration(db, calibration_id)
    if not db_calibration:
        return None
    
    update_data = calibration.model_dump(exclude_unset=True, by_alias=False)
    
    # Update instrument_name if instrument_id changed
    if 'instrument_id' in update_data:
        instrument = get_instrument(db, update_data['instrument_id'])
        if instrument:
            update_data['instrument_name'] = instrument.name
    
    for field, value in update_data.items():
        setattr(db_calibration, field, value)
    
    db_calibration.status = calculate_calibration_status(db_calibration)
    db.commit()
    db.refresh(db_calibration)
    return db_calibration


def delete_calibration(db: Session, calibration_id: int) -> bool:
    """Soft delete a calibration"""
    db_calibration = get_calibration(db, calibration_id)
    if not db_calibration:
        return False
    
    db_calibration.is_deleted = True
    db.commit()
    return True


# Transaction CRUD
def get_transactions(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    transaction_type: Optional[str] = None,
    search: Optional[str] = None
) -> List[InventoryTransaction]:
    """Get all transactions with optional filtering"""
    query = db.query(InventoryTransaction).filter(InventoryTransaction.is_deleted == False)
    
    if transaction_type:
        query = query.filter(InventoryTransaction.transaction_type == transaction_type)
    if search:
        search_filter = or_(
            InventoryTransaction.transaction_id.ilike(f"%{search}%"),
            InventoryTransaction.item_name.ilike(f"%{search}%"),
            InventoryTransaction.used_by.ilike(f"%{search}%"),
            InventoryTransaction.purpose.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    return query.order_by(InventoryTransaction.created_at.desc()).offset(skip).limit(limit).all()


def get_transaction(db: Session, transaction_id: int) -> Optional[InventoryTransaction]:
    """Get a specific transaction by ID"""
    return db.query(InventoryTransaction).filter(
        and_(InventoryTransaction.id == transaction_id, InventoryTransaction.is_deleted == False)
    ).first()


def create_transaction(db: Session, transaction: TransactionCreate) -> InventoryTransaction:
    """Create a new transaction and update stock if applicable"""
    transaction_data = transaction.model_dump(by_alias=False)
    
    # 1. Denormalize item_name and item_type if not provided
    item_id = transaction_data.get('item_id')
    item_name = transaction_data.get('item_name')
    item_type = transaction_data.get('item_type') or "Consumable"
    
    if item_id and not item_name:
        if item_type == "Consumable":
            item = get_consumable(db, item_id)
            if item:
                item_name = item.item_name
        else:
            item = get_instrument(db, item_id)
            if item:
                item_name = item.name
    
    # Update transaction_data with denormalized names
    transaction_data['item_name'] = item_name
    transaction_data['item_type'] = item_type

    # 2. Denormalize linked_test_name if linked_test_id provided
    linked_test_id = transaction_data.get('linked_test_id')
    if linked_test_id:
        from app.modules.test_management.crud import get_test_plan
        test_plan = get_test_plan(db, linked_test_id)
        if test_plan:
            transaction_data['linked_test_name'] = test_plan.name
    
    # 3. Update stock if it's a Consumable
    if item_id and item_type == "Consumable":
        consumable = get_consumable(db, item_id)
        if consumable:
            if transaction_data.get('transaction_type') in ['Usage', 'Wastage']:
                consumable.quantity_available -= transaction_data.get('quantity', 0)
                if consumable.quantity_available < 0:
                    consumable.quantity_available = 0
            elif transaction_data.get('transaction_type') == 'Addition':
                consumable.quantity_available += transaction_data.get('quantity', 0)
            
            consumable.status = calculate_consumable_status(consumable)
    
    db_transaction = InventoryTransaction(**transaction_data)
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction
