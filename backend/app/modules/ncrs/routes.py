from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.modules.ncrs.models import NCR
from app.modules.ncrs.schemas import NCRCreate, NCROut

router = APIRouter(prefix="/ncrs", tags=["NCRs"])

# 🔹 GET ALL NCRs
@router.get("", response_model=List[NCROut])
def get_ncrs(db: Session = Depends(get_db)):
    return db.query(NCR).order_by(NCR.id.desc()).all()

# 🔹 CREATE NCR
@router.post("", status_code=status.HTTP_201_CREATED)
def create_ncr(data: NCRCreate, db: Session = Depends(get_db)):
    if data.ncrNumber:
        existing = db.query(NCR).filter(
            NCR.ncrNumber == data.ncrNumber
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail="NCR number already exists"
            )

    ncr = NCR(**data.dict())
    db.add(ncr)
    db.commit()
    db.refresh(ncr)

    return {
        "success": True,
        "ncr": ncr
    }

# 🔹 GET NCR BY ID (optional – future)
@router.get("/{ncr_id}", response_model=NCROut)
def get_ncr(ncr_id: int, db: Session = Depends(get_db)):
    ncr = db.query(NCR).filter(NCR.id == ncr_id).first()
    if not ncr:
        raise HTTPException(status_code=404, detail="NCR not found")
    return ncr
