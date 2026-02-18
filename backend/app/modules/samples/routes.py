from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.modules.samples import service as services, schema

router = APIRouter(
    prefix="/samples",
    tags=["Samples"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("", response_model=list[schema.SampleResponse])
def list_samples(
    projectId: int | None = None,
    db: Session = Depends(get_db)
):
    return services.get_samples(db, projectId)

@router.post("", response_model=schema.SampleResponse)
def create_sample(
    sample: schema.SampleCreate,
    db: Session = Depends(get_db)
):
    return services.create_sample(db, sample)

@router.get("/{sample_id}", response_model=schema.SampleResponse)
def get_sample(
    sample_id: int,
    db: Session = Depends(get_db)
):
    return services.get_sample_by_id(db, sample_id)
