"""
API routes for Inventory Management
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.dependencies.auth_dependency import require_roles
from app.models.user_model import User
from app.services.rbac_service import log_audit
from . import crud, schemas


router = APIRouter()


# Instrument Routes
@router.get("/instruments", response_model=List[schemas.InstrumentResponse], tags=["Instruments"])
def list_instruments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all instruments with optional filtering"""
    return crud.get_instruments(db, skip=skip, limit=limit, status=status, department=department, search=search)


@router.get("/instruments/{instrument_id}", response_model=schemas.InstrumentResponse, tags=["Instruments"])
def get_instrument(instrument_id: int, db: Session = Depends(get_db)):
    """Get a specific instrument"""
    instrument = crud.get_instrument(db, instrument_id)
    if not instrument:
        raise HTTPException(status_code=404, detail="Instrument not found")
    return instrument


@router.post("/instruments", response_model=schemas.InstrumentResponse, status_code=201, tags=["Instruments"])
def create_instrument(instrument: schemas.InstrumentCreate, db: Session = Depends(get_db)):
    """Create a new instrument"""
    return crud.create_instrument(db, instrument)


@router.put("/instruments/{instrument_id}", response_model=schemas.InstrumentResponse, tags=["Instruments"])
def update_instrument(
    instrument_id: int,
    instrument: schemas.InstrumentUpdate,
    db: Session = Depends(get_db)
):
    """Update an instrument"""
    updated_instrument = crud.update_instrument(db, instrument_id, instrument)
    if not updated_instrument:
        raise HTTPException(status_code=404, detail="Instrument not found")
    return updated_instrument


@router.delete("/instruments/{instrument_id}", status_code=204, tags=["Instruments"])
def delete_instrument(
    instrument_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin")),
):
    """Delete an instrument (Admin only). Audit logged."""
    success = crud.delete_instrument(db, instrument_id)
    if not success:
        raise HTTPException(status_code=404, detail="Instrument not found")
    log_audit(db, current_user.id, "instrument.delete", "instrument", str(instrument_id), details={"role": current_user.role})
    db.commit()
    return None


@router.patch("/instruments/{instrument_id}/deactivate", status_code=204, tags=["Instruments"])
def deactivate_instrument(instrument_id: int, db: Session = Depends(get_db)):
    """Deactivate an instrument"""
    instrument = crud.get_instrument(db, instrument_id)
    if not instrument:
        raise HTTPException(status_code=404, detail="Instrument not found")
    
    instrument.status = "Out of Service"
    db.commit()
    return None


# Consumable Routes
@router.get("/consumables", response_model=List[schemas.ConsumableResponse], tags=["Consumables"])
def list_consumables(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all consumables with optional filtering"""
    return crud.get_consumables(db, skip=skip, limit=limit, category=category, search=search)


@router.get("/consumables/{consumable_id}", response_model=schemas.ConsumableResponse, tags=["Consumables"])
def get_consumable(consumable_id: int, db: Session = Depends(get_db)):
    """Get a specific consumable"""
    consumable = crud.get_consumable(db, consumable_id)
    if not consumable:
        raise HTTPException(status_code=404, detail="Consumable not found")
    return consumable


@router.post("/consumables", response_model=schemas.ConsumableResponse, status_code=201, tags=["Consumables"])
def create_consumable(consumable: schemas.ConsumableCreate, db: Session = Depends(get_db)):
    """Create a new consumable"""
    return crud.create_consumable(db, consumable)


@router.put("/consumables/{consumable_id}", response_model=schemas.ConsumableResponse, tags=["Consumables"])
def update_consumable(
    consumable_id: int,
    consumable: schemas.ConsumableUpdate,
    db: Session = Depends(get_db)
):
    """Update a consumable"""
    updated_consumable = crud.update_consumable(db, consumable_id, consumable)
    if not updated_consumable:
        raise HTTPException(status_code=404, detail="Consumable not found")
    return updated_consumable


@router.delete("/consumables/{consumable_id}", status_code=204, tags=["Consumables"])
def delete_consumable(
    consumable_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin")),
):
    """Delete a consumable (Admin only). Audit logged."""
    success = crud.delete_consumable(db, consumable_id)
    if not success:
        raise HTTPException(status_code=404, detail="Consumable not found")
    log_audit(db, current_user.id, "consumable.delete", "consumable", str(consumable_id), details={"role": current_user.role})
    db.commit()
    return None


# Calibration Routes
@router.get("/calibrations", response_model=List[schemas.CalibrationResponse], tags=["Calibrations"])
def list_calibrations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    instrument_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all calibrations with optional filtering"""
    return crud.get_calibrations(db, skip=skip, limit=limit, instrument_id=instrument_id, search=search)


@router.get("/calibrations/{calibration_id}", response_model=schemas.CalibrationResponse, tags=["Calibrations"])
def get_calibration(calibration_id: int, db: Session = Depends(get_db)):
    """Get a specific calibration"""
    calibration = crud.get_calibration(db, calibration_id)
    if not calibration:
        raise HTTPException(status_code=404, detail="Calibration not found")
    return calibration


@router.post("/calibrations", response_model=schemas.CalibrationResponse, status_code=201, tags=["Calibrations"])
def create_calibration(calibration: schemas.CalibrationCreate, db: Session = Depends(get_db)):
    """Create a new calibration"""
    return crud.create_calibration(db, calibration)


@router.put("/calibrations/{calibration_id}", response_model=schemas.CalibrationResponse, tags=["Calibrations"])
def update_calibration(
    calibration_id: int,
    calibration: schemas.CalibrationUpdate,
    db: Session = Depends(get_db)
):
    """Update a calibration"""
    updated_calibration = crud.update_calibration(db, calibration_id, calibration)
    if not updated_calibration:
        raise HTTPException(status_code=404, detail="Calibration not found")
    return updated_calibration


@router.delete("/calibrations/{calibration_id}", status_code=204, tags=["Calibrations"])
def delete_calibration(
    calibration_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin")),
):
    """Delete a calibration (Admin only). Audit logged."""
    success = crud.delete_calibration(db, calibration_id)
    if not success:
        raise HTTPException(status_code=404, detail="Calibration not found")
    log_audit(db, current_user.id, "calibration.delete", "calibration", str(calibration_id), details={"role": current_user.role})
    db.commit()
    return None


# Transaction Routes
@router.get("/inventory-transactions", response_model=List[schemas.TransactionResponse], tags=["Transactions"])
def list_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    transaction_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all inventory transactions with optional filtering"""
    return crud.get_transactions(db, skip=skip, limit=limit, transaction_type=transaction_type, search=search)


@router.get("/inventory-transactions/{transaction_id}", response_model=schemas.TransactionResponse, tags=["Transactions"])
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """Get a specific transaction"""
    transaction = crud.get_transaction(db, transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction


@router.post("/inventory-transactions", response_model=schemas.TransactionResponse, status_code=201, tags=["Transactions"])
def create_transaction(transaction: schemas.TransactionCreate, db: Session = Depends(get_db)):
    """Create a new inventory transaction"""
    return crud.create_transaction(db, transaction)
