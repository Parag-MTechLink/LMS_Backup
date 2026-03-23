import os
import shutil
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.reports.models import Report
from app.modules.reports.schemas import ReportResponse

router = APIRouter(prefix="/reports", tags=["Reports"])

UPLOAD_DIR = "uploads/reports"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("", response_model=ReportResponse)
def upload_report(
    name: str = Form(...),
    description: str = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    report = Report(
        name=name,
        description=description,
        file_path=file_path,
        file_type=file.content_type,
    )

    db.add(report)
    db.commit()
    db.refresh(report)

    return report


@router.get("", response_model=list[ReportResponse])
def get_reports(db: Session = Depends(get_db)):
    return db.query(Report).order_by(Report.created_at.desc()).all()


@router.get("/{report_id}/download")
def download_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()

    if not report or not os.path.exists(report.file_path):
        raise HTTPException(status_code=404, detail="Report not found")

    return FileResponse(
        path=report.file_path,
        media_type=report.file_type,
        filename=os.path.basename(report.file_path),
    )
