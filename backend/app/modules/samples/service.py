from sqlalchemy.orm import Session
from app.modules.samples.models import Sample
from app.modules.samples.schema import SampleCreate


def create_sample(db: Session, sample: SampleCreate):
    """
    Create a new sample.

    If projectId is provided but projectName is not, look up the project and
    denormalize its name into Sample.projectName so the UI can display it
    without an extra join.
    """
    project_name = sample.projectName
    if sample.projectId and not project_name:
        try:
            from app.modules.projects.crud import get_project

            project = get_project(db, sample.projectId)
            if project:
                project_name = project.name
        except Exception:
            # If projects module changes or is unavailable, fall back gracefully
            pass

    sample_data = sample.dict(exclude={"projectName"})
    db_sample = Sample(**sample_data, projectName=project_name)
    db.add(db_sample)
    db.commit()
    db.refresh(db_sample)
    return db_sample

def get_samples(db: Session, project_id: int | None = None):
    query = db.query(Sample)
    if project_id:
        query = query.filter(Sample.projectId == project_id)
    return query.all()

def get_sample_by_id(db: Session, sample_id: int):
    return db.query(Sample).filter(Sample.id == sample_id).first()
