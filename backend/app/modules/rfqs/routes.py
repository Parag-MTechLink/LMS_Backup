from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.dependencies.auth_dependency import require_roles
from app.models.user_model import User
from app.services.rbac_service import log_audit
from app.modules.rfqs.models import RFQ
from app.modules.projects.models import Customer
from app.modules.rfqs.schemas import RFQCreate


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
def get_rfqs(db: Session = Depends(get_db)):
    rfqs = (
        db.query(RFQ)
        .filter((RFQ.is_deleted == False) | (RFQ.is_deleted == None))
        .all()
    )

    return [
        {
            "id": r.id,
            "customerId": r.customerId,
            "customerName": r.customerName,
            "product": r.product,
            "receivedDate": r.receivedDate,
            "status": r.status,
        }
        for r in rfqs
    ]


# 🔹 CREATE RFQ
@router.post("")
def create_rfq(data: RFQCreate, db: Session = Depends(get_db)):
    # Lookup customer name if not provided
    customer_name = data.customerName
    if not customer_name:
        customer = db.query(Customer).filter(Customer.id == data.customerId).first()
        if customer:
            customer_name = customer.company_name

    new_rfq = RFQ(
        customerId=data.customerId,
        customerName=customer_name,
        product=data.product,
        receivedDate=data.receivedDate,
        status="pending",
    )

    db.add(new_rfq)
    db.commit()
    db.refresh(new_rfq)

    return {
        "rfq": {
            "id": new_rfq.id,
            "customerId": new_rfq.customerId,
            "customerName": new_rfq.customerName,
            "product": new_rfq.product,
            "receivedDate": new_rfq.receivedDate,
            "status": new_rfq.status,
        }
    }

# 🔹 GET RFQ BY ID
@router.get("/{id}")
def get_rfq(id: int, db: Session = Depends(get_db)):
    rfq = db.query(RFQ).filter(RFQ.id == id, RFQ.is_deleted == False).first()
    if not rfq:
        return None
    
    return {
        "id": rfq.id,
        "customerId": rfq.customerId,
        "customerName": rfq.customerName,
        "product": rfq.product,
        "receivedDate": rfq.receivedDate,
        "status": rfq.status,
    }


# 🔹 UPDATE RFQ STATUS
@router.patch("/{id}/status")
def update_rfq_status(id: int, body: RFQStatusUpdate, db: Session = Depends(get_db)):
    rfq = db.query(RFQ).filter(RFQ.id == id, RFQ.is_deleted == False).first()
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    rfq.status = body.status
    db.commit()
    return {"success": True, "status": rfq.status}


# 🔹 DELETE RFQ (Admin only, soft delete, audit logged)
@router.delete("/{id}", status_code=204)
def delete_rfq(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin")),
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
