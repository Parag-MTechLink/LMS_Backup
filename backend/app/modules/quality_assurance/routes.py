"""
Quality Assurance Module API Routes
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from pydantic import BaseModel, Field

from app.core.database import get_db
from . import crud, schemas, models


router = APIRouter()


# ============= SOP Routes =============

@router.get("/sops", response_model=List[schemas.SOPResponse])
def get_sops(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all SOPs with optional filtering"""
    sops = crud.get_sops(db, skip=skip, limit=limit, search=search, category=category, status=status)
    return sops


@router.post("/sops", response_model=schemas.SOPResponse, status_code=201)
def create_sop(sop: schemas.SOPCreate, db: Session = Depends(get_db)):
    """Create a new SOP"""
    return crud.create_sop(db, sop)


@router.get("/sops/{sop_id}", response_model=schemas.SOPResponse)
def get_sop(sop_id: int, db: Session = Depends(get_db)):
    """Get a single SOP by ID"""
    sop = crud.get_sop(db, sop_id)
    if not sop:
        raise HTTPException(status_code=404, detail="SOP not found")
    return sop


@router.put("/sops/{sop_id}", response_model=schemas.SOPResponse)
def update_sop(sop_id: int, sop: schemas.SOPUpdate, db: Session = Depends(get_db)):
    """Update an existing SOP"""
    updated_sop = crud.update_sop(db, sop_id, sop)
    if not updated_sop:
        raise HTTPException(status_code=404, detail="SOP not found")
    return updated_sop


@router.delete("/sops/{sop_id}", status_code=204)
def delete_sop(sop_id: int, db: Session = Depends(get_db)):
    """Delete an SOP"""
    success = crud.delete_sop(db, sop_id)
    if not success:
        raise HTTPException(status_code=404, detail="SOP not found")
    return None


# ============= Document Routes =============

@router.get("/qc-documents", response_model=List[schemas.DocumentResponse])
def get_documents(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    document_type: Optional[str] = Query(None, alias="documentType"),
    db: Session = Depends(get_db)
):
    """Get all QC documents with optional filtering"""
    documents = crud.get_documents(
        db, skip=skip, limit=limit, search=search, 
        category=category, document_type=document_type
    )
    return documents


@router.post("/qc-documents", response_model=schemas.DocumentResponse, status_code=201)
def create_document(document: schemas.DocumentCreate, db: Session = Depends(get_db)):
    """Create a new QC document"""
    return crud.create_document(db, document)


@router.get("/qc-documents/{document_id}", response_model=schemas.DocumentResponse)
def get_document(document_id: int, db: Session = Depends(get_db)):
    """Get a single QC document by ID"""
    document = crud.get_document(db, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@router.put("/qc-documents/{document_id}", response_model=schemas.DocumentResponse)
def update_document(
    document_id: int, 
    document: schemas.DocumentUpdate, 
    db: Session = Depends(get_db)
):
    """Update an existing QC document"""
    updated_document = crud.update_document(db, document_id, document)
    if not updated_document:
        raise HTTPException(status_code=404, detail="Document not found")
    return updated_document


@router.delete("/qc-documents/{document_id}", status_code=204)
def delete_document(document_id: int, db: Session = Depends(get_db)):
    """Delete a QC document"""
    success = crud.delete_document(db, document_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    return None


@router.patch("/qc-documents/{document_id}/lock", response_model=schemas.DocumentResponse)
def lock_document(document_id: int, db: Session = Depends(get_db)):
    """Lock a QC document"""
    document = crud.lock_document(db, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@router.patch("/qc-documents/{document_id}/unlock", response_model=schemas.DocumentResponse)
def unlock_document(document_id: int, db: Session = Depends(get_db)):
    """Unlock a QC document"""
    document = crud.unlock_document(db, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


# ============= QC Check Routes =============

@router.get("/qc-checks", response_model=List[schemas.QCCheckResponse])
def get_qc_checks(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all QC checks with optional filtering"""
    qc_checks = crud.get_qc_checks(db, skip=skip, limit=limit, search=search, status=status)
    
    # Transform acceptance_range for response
    result = []
    for qc in qc_checks:
        qc_dict = {
            "id": qc.id,
            "qc_id": qc.qc_id,
            "test_name": qc.test_name,
            "parameter": qc.parameter,
            "target_value": qc.target_value,
            "unit": qc.unit,
            "acceptance_range": {
                "min": qc.acceptance_range_min,
                "max": qc.acceptance_range_max
            },
            "last_result": qc.last_result,
            "status": qc.status,
            "frequency": qc.frequency,
            "last_check_date": qc.last_check_date,
            "deviation": qc.deviation,
            "trend": qc.trend,
            "created_at": qc.created_at,
            "updated_at": qc.updated_at
        }
        result.append(schemas.QCCheckResponse(**qc_dict))
    
    return result


@router.post("/qc-checks", response_model=schemas.QCCheckResponse, status_code=201)
def create_qc_check(qc_check: schemas.QCCheckCreate, db: Session = Depends(get_db)):
    """Create a new QC check"""
    qc = crud.create_qc_check(db, qc_check)
    
    # Transform for response
    qc_dict = {
        "id": qc.id,
        "qc_id": qc.qc_id,
        "test_name": qc.test_name,
        "parameter": qc.parameter,
        "target_value": qc.target_value,
        "unit": qc.unit,
        "acceptance_range": {
            "min": qc.acceptance_range_min,
            "max": qc.acceptance_range_max
        },
        "last_result": qc.last_result,
        "status": qc.status,
        "frequency": qc.frequency,
        "last_check_date": qc.last_check_date,
        "deviation": qc.deviation,
        "trend": qc.trend,
        "created_at": qc.created_at,
        "updated_at": qc.updated_at
    }
    
    return schemas.QCCheckResponse(**qc_dict)


@router.get("/qc-checks/{qc_id}", response_model=schemas.QCCheckResponse)
def get_qc_check(qc_id: int, db: Session = Depends(get_db)):
    """Get a single QC check by ID"""
    qc = crud.get_qc_check(db, qc_id)
    if not qc:
        raise HTTPException(status_code=404, detail="QC check not found")
    
    # Transform for response
    qc_dict = {
        "id": qc.id,
        "qc_id": qc.qc_id,
        "test_name": qc.test_name,
        "parameter": qc.parameter,
        "target_value": qc.target_value,
        "unit": qc.unit,
        "acceptance_range": {
            "min": qc.acceptance_range_min,
            "max": qc.acceptance_range_max
        },
        "last_result": qc.last_result,
        "status": qc.status,
        "frequency": qc.frequency,
        "last_check_date": qc.last_check_date,
        "deviation": qc.deviation,
        "trend": qc.trend,
        "created_at": qc.created_at,
        "updated_at": qc.updated_at
    }
    
    return schemas.QCCheckResponse(**qc_dict)


@router.put("/qc-checks/{qc_id}", response_model=schemas.QCCheckResponse)
def update_qc_check(
    qc_id: int, 
    qc_check: schemas.QCCheckUpdate, 
    db: Session = Depends(get_db)
):
    """Update an existing QC check"""
    qc = crud.update_qc_check(db, qc_id, qc_check)
    if not qc:
        raise HTTPException(status_code=404, detail="QC check not found")
    
    # Transform for response
    qc_dict = {
        "id": qc.id,
        "qc_id": qc.qc_id,
        "test_name": qc.test_name,
        "parameter": qc.parameter,
        "target_value": qc.target_value,
        "unit": qc.unit,
        "acceptance_range": {
            "min": qc.acceptance_range_min,
            "max": qc.acceptance_range_max
        },
        "last_result": qc.last_result,
        "status": qc.status,
        "frequency": qc.frequency,
        "last_check_date": qc.last_check_date,
        "deviation": qc.deviation,
        "trend": qc.trend,
        "created_at": qc.created_at,
        "updated_at": qc.updated_at
    }
    
    return schemas.QCCheckResponse(**qc_dict)


@router.delete("/qc-checks/{qc_id}", status_code=204)
def delete_qc_check(qc_id: int, db: Session = Depends(get_db)):
    """Delete a QC check"""
    success = crud.delete_qc_check(db, qc_id)
    if not success:
        raise HTTPException(status_code=404, detail="QC check not found")
    return None


class QCResultRequest(schemas.BaseModel):
    result: float
    check_date: date = Field(..., alias="checkDate")
    
    class Config:
        populate_by_name = True


@router.post("/qc-checks/{qc_id}/record-result", response_model=schemas.QCCheckResponse)
def record_qc_result(
    qc_id: int, 
    result_data: QCResultRequest,
    db: Session = Depends(get_db)
):
    """Record a QC check result"""
    qc = crud.record_qc_result(db, qc_id, result_data.result, result_data.check_date)
    if not qc:
        raise HTTPException(status_code=404, detail="QC check not found")
    
    # Transform for response
    qc_dict = {
        "id": qc.id,
        "qc_id": qc.qc_id,
        "test_name": qc.test_name,
        "parameter": qc.parameter,
        "target_value": qc.target_value,
        "unit": qc.unit,
        "acceptance_range": {
            "min": qc.acceptance_range_min,
            "max": qc.acceptance_range_max
        },
        "last_result": qc.last_result,
        "status": qc.status,
        "frequency": qc.frequency,
        "last_check_date": qc.last_check_date,
        "deviation": qc.deviation,
        "trend": qc.trend,
        "created_at": qc.created_at,
        "updated_at": qc.updated_at
    }
    
    return schemas.QCCheckResponse(**qc_dict)


# ============= NC/CAPA Routes =============

@router.get("/nc-capa", response_model=List[schemas.NCCAPAResponse])
def get_nc_capas(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all NC/CAPA records with optional filtering"""
    nc_capas = crud.get_nc_capas(
        db, skip=skip, limit=limit, search=search, 
        status=status, severity=severity
    )
    return nc_capas


@router.post("/nc-capa", response_model=schemas.NCCAPAResponse, status_code=201)
def create_nc_capa(nc_capa: schemas.NCCAPACreate, db: Session = Depends(get_db)):
    """Create a new NC/CAPA"""
    return crud.create_nc_capa(db, nc_capa)


@router.get("/nc-capa/{nc_id}", response_model=schemas.NCCAPAResponse)
def get_nc_capa(nc_id: int, db: Session = Depends(get_db)):
    """Get a single NC/CAPA by ID"""
    nc_capa = crud.get_nc_capa(db, nc_id)
    if not nc_capa:
        raise HTTPException(status_code=404, detail="NC/CAPA not found")
    return nc_capa


@router.put("/nc-capa/{nc_id}", response_model=schemas.NCCAPAResponse)
def update_nc_capa(
    nc_id: int, 
    nc_capa: schemas.NCCAPAUpdate, 
    db: Session = Depends(get_db)
):
    """Update an existing NC/CAPA"""
    updated_nc = crud.update_nc_capa(db, nc_id, nc_capa)
    if not updated_nc:
        raise HTTPException(status_code=404, detail="NC/CAPA not found")
    return updated_nc


@router.delete("/nc-capa/{nc_id}", status_code=204)
def delete_nc_capa(nc_id: int, db: Session = Depends(get_db)):
    """Delete an NC/CAPA"""
    success = crud.delete_nc_capa(db, nc_id)
    if not success:
        raise HTTPException(status_code=404, detail="NC/CAPA not found")
    return None


class CloseNCRequest(schemas.BaseModel):
    closure_date: date = Field(..., alias="closureDate")
    
    class Config:
        populate_by_name = True


@router.patch("/nc-capa/{nc_id}/close", response_model=schemas.NCCAPAResponse)
def close_nc_capa(
    nc_id: int, 
    close_data: CloseNCRequest,
    db: Session = Depends(get_db)
):
    """Close an NC/CAPA"""
    nc_capa = crud.close_nc_capa(db, nc_id, close_data.closure_date)
    if not nc_capa:
        raise HTTPException(status_code=404, detail="NC/CAPA not found")
    return nc_capa


# ============= Audit Routes =============

@router.get("/audits", response_model=List[schemas.AuditResponse])
def get_audits(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None),
    audit_type: Optional[str] = Query(None, alias="auditType"),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all audits with optional filtering"""
    audits = crud.get_audits(
        db, skip=skip, limit=limit, search=search, 
        audit_type=audit_type, status=status
    )
    return audits


@router.post("/audits", response_model=schemas.AuditResponse, status_code=201)
def create_audit(audit: schemas.AuditCreate, db: Session = Depends(get_db)):
    """Create a new audit"""
    return crud.create_audit(db, audit)


@router.get("/audits/{audit_id}", response_model=schemas.AuditResponse)
def get_audit(audit_id: int, db: Session = Depends(get_db)):
    """Get a single audit by ID"""
    audit = crud.get_audit(db, audit_id)
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    return audit


@router.put("/audits/{audit_id}", response_model=schemas.AuditResponse)
def update_audit(
    audit_id: int, 
    audit: schemas.AuditUpdate, 
    db: Session = Depends(get_db)
):
    """Update an existing audit"""
    updated_audit = crud.update_audit(db, audit_id, audit)
    if not updated_audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    return updated_audit


@router.delete("/audits/{audit_id}", status_code=204)
def delete_audit(audit_id: int, db: Session = Depends(get_db)):
    """Delete an audit"""
    success = crud.delete_audit(db, audit_id)
    if not success:
        raise HTTPException(status_code=404, detail="Audit not found")
    return None
