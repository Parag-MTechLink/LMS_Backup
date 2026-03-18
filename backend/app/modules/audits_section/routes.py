from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.modules.audits_section.models import Audit
from app.modules.audits_section.schemas import AuditCreate, AuditOut
from typing import List

router = APIRouter(prefix="/audits-section", tags=["Audits Section"])

# 🔹 GET ALL AUDITS
@router.get("", response_model=List[AuditOut])
def get_audits(db: Session = Depends(get_db)):
    return db.query(Audit).order_by(Audit.id.desc()).all()

# 🔹 CREATE AUDIT
@router.post("", status_code=status.HTTP_201_CREATED)
def create_audit(data: AuditCreate, db: Session = Depends(get_db)):
    existing = db.query(Audit).filter(Audit.auditNumber == data.auditNumber).first()
    if existing:
        raise HTTPException(status_code=400, detail="Audit number must be unique. This audit number already exists.")

    audit = Audit(**data.dict())
    db.add(audit)
    db.commit()
    db.refresh(audit)

    return {
        "success": True,
        "audit": audit
    }

# 🔹 GET AUDIT BY ID (optional – future)
@router.get("/{audit_id}", response_model=AuditOut)
def get_audit(audit_id: int, db: Session = Depends(get_db)):
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    return audit
