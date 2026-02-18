import os
import shutil
from sqlalchemy.orm import Session
from fastapi import UploadFile
from app.modules.document.models import Document

UPLOAD_DIR = "uploads/documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def save_document(
    db: Session,
    name: str,
    description: str | None,
    doc_type: str,
    file: UploadFile,
):
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    document = Document(
        name=name,
        description=description,
        type=doc_type,
        file_path=file_path,
        file_type=file.content_type,
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    return document
