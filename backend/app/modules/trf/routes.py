from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies.auth_dependency import require_permission
from app.models.user_model import User

from app.core.database import get_db
from app.modules.trf.models import TRF
from app.modules.trf.schemas import TRFCreate, TRFResponse

router = APIRouter(
    prefix="/trfs",     # 🔥 MUST be /trfs
    tags=["TRFs"]
)

@router.post("", response_model=TRFResponse)
def create_trf(
    trf: TRFCreate, 
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("trf:full"))
):
    from app.modules.projects.models import Project  # Import here to avoid circular imports?
    
    if trf.trfNumber:
        existing = db.query(TRF).filter(TRF.trfNumber == trf.trfNumber).first()
        if existing:
            raise HTTPException(status_code=400, detail="TRF number must be unique. This TRF number already exists.")

    project = db.query(Project).filter(Project.id == trf.projectId).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    trf_data = trf.model_dump()
    trf_data['projectName'] = project.name
    
    new_trf = TRF(**trf_data)
    db.add(new_trf)
    db.commit()
    db.refresh(new_trf)
    return new_trf

@router.get("", response_model=list[TRFResponse])
def get_trfs(
    project_id: int | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("trf:view"))
):
    query = db.query(TRF)
    if project_id is not None:
        query = query.filter(TRF.projectId == project_id)
    return query.all()

@router.get("/{id}", response_model=TRFResponse)
def get_trf(
    id: int, 
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("trf:view"))
):
    trf = db.query(TRF).filter(TRF.id == id).first()
    if not trf:
        raise HTTPException(status_code=404, detail="TRF not found")
    return trf
