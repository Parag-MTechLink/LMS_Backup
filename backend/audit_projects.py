import sys
import os

# Add current directory to path for imports
sys.path.append(os.getcwd())

from app.core.database import SessionLocal
from app.modules.projects.models import Project
from app.modules.projects.schemas import ProjectResponse

def validate_projects_list():
    db = SessionLocal()
    try:
        # This is what crud.get_projects(db) returns: List[Project]
        projects = db.query(Project).filter(Project.is_deleted == False).all()
        print(f"Found {len(projects)} projects.")
        
        for p in projects:
            try:
                # This is what FastAPI does internally with response_model=List[ProjectResponse]
                ProjectResponse.model_validate(p)
                print(f"Project {p.id} ({p.name}) - VALID (as ORM)")
            except Exception as e:
                print(f"Project {p.id} ({p.name}) - FAILED: {e}")
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    validate_projects_list()
