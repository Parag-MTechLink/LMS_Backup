from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.dependencies.auth_dependency import require_roles, require_permission
from app.models.user_model import User
from uuid import UUID
from app.routes.notifications import create_notification
from app.services.rbac_service import log_audit
from app.modules.rfqs.models import RFQ
from app.modules.projects.models import Customer
from app.modules.rfqs.schemas import RFQCreate, NoteRequest
import os
import shutil
from fastapi import File, UploadFile, Form
from typing import Optional
from datetime import datetime

UPLOAD_DIR = "uploads/rfqs"
os.makedirs(UPLOAD_DIR, exist_ok=True)


class RFQStatusUpdate(BaseModel):
    status: str

router = APIRouter(prefix="/rfqs", tags=["RFQs"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# 🔹 GET ALL RFQs (exclude soft-deleted)
@router.get("")
def get_rfqs(
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("rfq:view"))
):
    rfqs = (
        db.query(
            RFQ.id,
            RFQ.customerId,
            Customer.company_name.label("customerName"),
            RFQ.product,
            RFQ.receivedDate,
            RFQ.description,
            RFQ.status,
            RFQ.feasibility_notes,
            RFQ.feasibility_attachment_url,
            RFQ.feasibility_notes,
            RFQ.feasibility_attachment_url,
            RFQ.feasibility_done_by_name,
            RFQ.feasibility_done_by_role,
            RFQ.feasibility_done_at,
            RFQ.quotation_notes,
            RFQ.quotation_attachment_url,
            RFQ.quotation_done_by_name,
            RFQ.quotation_done_by_role,
            RFQ.quotation_done_at,
        )
        .join(Customer, RFQ.customerId == Customer.id)
        .filter(Customer.is_deleted == False, RFQ.is_deleted == False)
        .all()
    )

    return [
        {
            "id": r.id,
            "customerId": r.customerId,
            "customerName": r.customerName,
            "product": r.product,
            "receivedDate": r.receivedDate,
            "description": r.description,
            "status": r.status,
            "feasibility_notes": r.feasibility_notes,
            "feasibility_attachment_url": f"/{r.feasibility_attachment_url}" if r.feasibility_attachment_url else None,
            "quotation_notes": r.quotation_notes,
            "quotation_attachment_url": f"/{r.quotation_attachment_url}" if r.quotation_attachment_url else None,
            "feasibility_done_by_name": r.feasibility_done_by_name,
            "feasibility_done_by_role": r.feasibility_done_by_role,
            "feasibility_done_at": r.feasibility_done_at,
            "quotation_done_by_name": r.quotation_done_by_name,
            "quotation_done_by_role": r.quotation_done_by_role,
            "quotation_done_at": r.quotation_done_at,
        }
        for r in rfqs
    ]


# 🔹 CREATE RFQ
@router.post("")
def create_rfq(
    data: RFQCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("rfq:full"))
):
    new_rfq = RFQ(
        customerId=data.customerId,
        product=data.product,
        receivedDate=data.receivedDate,
        description=data.description,
        status="pending",
    )

    db.add(new_rfq)
    db.commit()
    db.refresh(new_rfq)

    # Step 1 -> Notify Technical Manager
    create_notification(
        db=db,
        recipient_role="Technical Manager",
        title="New RFQ Created",
        message=f"A new RFQ has been created and is pending feasibility check.",
        triggered_by=current_user,
        entity_type="rfq",
        entity_id=str(new_rfq.id),
        entity_url=f"/lab/management/rfqs"
    )

    customer = db.query(Customer).filter(Customer.id == data.customerId).first()

    return {
        "rfq": {
            "id": new_rfq.id,
            "customerId": new_rfq.customerId,
            "customerName": customer.company_name if customer else "",
            "product": new_rfq.product,
            "receivedDate": new_rfq.receivedDate,
            "description": new_rfq.description,
            "status": new_rfq.status,
        }
    }

# 🔹 GET RFQ BY ID
@router.get("/{id}")
def get_rfq(
    id: int, 
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("rfq:view"))
):
    rfq = db.query(RFQ).filter(RFQ.id == id, RFQ.is_deleted == False).first()
    if not rfq:
        return None
        
    customer = db.query(Customer).filter(Customer.id == rfq.customerId).first()
    
    return {
        "id": rfq.id,
        "customerId": rfq.customerId,
        "customerName": customer.company_name if customer else "",
        "product": rfq.product,
        "receivedDate": rfq.receivedDate,
        "description": rfq.description,
        "status": rfq.status,
        "feasibility_notes": rfq.feasibility_notes,
        "feasibility_attachment_url": f"/{rfq.feasibility_attachment_url}" if rfq.feasibility_attachment_url else None,
        "quotation_notes": rfq.quotation_notes,
        "quotation_attachment_url": f"/{rfq.quotation_attachment_url}" if rfq.quotation_attachment_url else None,
        "feasibility_done_by_name": rfq.feasibility_done_by_name,
        "feasibility_done_by_role": rfq.feasibility_done_by_role,
        "feasibility_done_at": rfq.feasibility_done_at,
        "quotation_done_by_name": rfq.quotation_done_by_name,
        "quotation_done_by_role": rfq.quotation_done_by_role,
        "quotation_done_at": rfq.quotation_done_at,
    }


# 🔹 UPDATE RFQ STATUS
@router.patch("/{id}/status")
def update_rfq_status(
    id: int, 
    body: RFQStatusUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("rfq:full"))
):
    rfq = db.query(RFQ).filter(RFQ.id == id, RFQ.is_deleted == False).first()
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    
    old_status = rfq.status
    rfq.status = body.status
    db.commit()
    
    log_audit(
        db, current_user.id, "rfq.status_update",
        resource_type="rfq", resource_id=str(id),
        details={"old_status": old_status, "new_status": body.status},
    )
    db.commit()
    return {"success": True, "status": rfq.status}


@router.post("/{id}/feasibility")
def feasibility_check(
    id: int,
    notes: str = Form(...),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Technical Manager", "Admin"))
):
    rfq = db.query(RFQ).filter(RFQ.id == id, RFQ.is_deleted == False).first()
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    
    if file:
        file_path = os.path.join(UPLOAD_DIR, f"rfq_{id}_feasibility_{file.filename}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        rfq.feasibility_attachment_url = file_path.replace("\\", "/")

    rfq.status = "feasibility_done"
    rfq.technical_manager_id = current_user.id
    rfq.feasibility_notes = notes
    rfq.feasibility_done_by_name = current_user.full_name
    rfq.feasibility_done_by_role = current_user.role
    rfq.feasibility_done_at = datetime.utcnow()
    db.commit()

    # Step 2 -> Notify Finance Manager
    create_notification(
        db=db,
        recipient_role="Finance Manager",
        title="Feasibility Completed",
        message=f"Feasibility done for RFQ #{rfq.id}. Ready for quotation.",
        triggered_by=current_user,
        entity_type="rfq",
        entity_id=str(rfq.id),
        entity_url=f"/lab/management/rfqs"
    )
    return {"success": True, "status": rfq.status}


@router.post("/{id}/quotation")
def prepare_quotation(
    id: int,
    notes: str = Form(...),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Finance Manager", "Admin"))
):
    rfq = db.query(RFQ).filter(RFQ.id == id, RFQ.is_deleted == False).first()
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    
    if file:
        file_path = os.path.join(UPLOAD_DIR, f"rfq_{id}_quotation_{file.filename}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        rfq.quotation_attachment_url = file_path.replace("\\", "/")

    rfq.status = "quotation_review"
    rfq.finance_manager_id = current_user.id
    rfq.quotation_notes = notes
    rfq.quotation_done_by_name = current_user.full_name
    rfq.quotation_done_by_role = current_user.role
    rfq.quotation_done_at = datetime.utcnow()
    db.commit()

    # Step 3 -> Notify Project Manager & Sales Manager
    for role in ["Project Manager", "Sales Manager"]:
        create_notification(
            db=db,
            recipient_role=role,
            title="Quotation Ready",
            message=f"A new quotation has been prepared for RFQ #{rfq.id} and is ready for review.",
            triggered_by=current_user,
            entity_type="rfq",
            entity_id=str(rfq.id),
            entity_url=f"/lab/management/rfqs"
        )

    return {"success": True, "status": rfq.status}


# 🔹 APPROVE RFQ (Project Manager / Sales Manager)
@router.post("/{id}/approve")
def approve_rfq(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Project Manager", "Sales Manager", "Admin"))
):
    rfq = db.query(RFQ).filter(RFQ.id == id, RFQ.is_deleted == False).first()
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    
    rfq.status = "approved"
    db.commit()

    # Step 4 -> Notify relevant roles (Admin/Sales)
    create_notification(
        db=db,
        recipient_role="Sales Manager",
        title="RFQ Approved",
        message=f"RFQ #{rfq.id} has been approved and sent to the customer.",
        triggered_by=current_user,
        entity_type="rfq",
        entity_id=str(rfq.id),
        entity_url=f"/lab/management/rfqs"
    )

    return {"success": True, "status": rfq.status}


# 🔹 DELETE RFQ (Admin only, soft delete, audit logged)
@router.delete("/{id}", status_code=204)
def delete_rfq(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("rfq:full")),
):
    rfq = db.query(RFQ).filter(RFQ.id == id, RFQ.is_deleted == False).first()
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    rfq.is_deleted = True
    log_audit(
        db, current_user.id, "rfq.delete",
        resource_type="rfq", resource_id=str(id),
        details={"role": current_user.role},
    )
    db.commit()
    return None
