
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.modules.certification.models import Certification
from app.modules.certification.schemas import CertificationCreate, CertificationResponse

router = APIRouter(prefix="/certifications", tags=["Certifications"])

@router.get("", response_model=list[CertificationResponse])
def get_certifications(db: Session = Depends(get_db)):
    return db.query(Certification).all()

from fastapi import HTTPException

from fastapi import HTTPException, status

@router.post("", status_code=status.HTTP_201_CREATED)
def create_certification(data: CertificationCreate, db: Session = Depends(get_db)):
    existing = db.query(Certification).filter(
        Certification.certificateNumber == data.certificateNumber
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Certificate number already exists"
        )

    cert = Certification(**data.dict())
    db.add(cert)
    db.commit()
    db.refresh(cert)

    return {
        "success": True,
        "certification": cert
    }



@router.get("/{certification_id}", response_model=CertificationResponse)
def get_certification(certification_id: int, db: Session = Depends(get_db)):
    return db.query(Certification).filter(Certification.id == certification_id).first()
