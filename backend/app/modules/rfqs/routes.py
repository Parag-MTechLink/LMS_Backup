from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from fastapi.responses import Response, FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.dependencies.auth_dependency import require_roles
from app.models.user_model import User
from app.services.rbac_service import log_audit
from app.modules.rfqs.models import RFQ
from app.modules.projects.models import Customer
from app.modules.rfqs.schemas import RFQCreate
from app.modules.rfqs.docx_parser import parse_rfq_docx
import io
import os
import shutil
from datetime import datetime
from app.core.config import settings

class RFQStatusUpdate(BaseModel):
    status: str

router = APIRouter(prefix="/rfqs", tags=["RFQs"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ── STATIC / FIXED ROUTES (Must come before /{id}) ──

@router.get("/template")
def download_rfq_template():
    template_path = os.path.join("app", "static", "templates", "rfq_template.docx")
    if not os.path.exists(template_path):
        raise HTTPException(status_code=404, detail="Template not found")
    return FileResponse(
        path=template_path,
        filename="Job_Request_Form_Template.docx",
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

@router.post("/upload")
async def upload_rfq(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename or not file.filename.lower().endswith(".docx"):
        raise HTTPException(status_code=400, detail="Only .docx files are accepted.")

    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large")
    
    # Save file to uploads/rfqs
    filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}"
    upload_dir = os.path.join(settings.UPLOAD_DIR, "rfqs")
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, filename)
    
    with open(file_path, "wb") as f:
        f.write(content)

    # Parse Word Document
    try:
        parsed_data = parse_rfq_docx(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing Word document: {str(e)}")

    if not parsed_data or not parsed_data.get("customer", {}).get("companyName"):
        raise HTTPException(status_code=400, detail="Could not extract customer name from document.")

    cust_data = parsed_data["customer"]
    rfq_data = parsed_data["rfq"]

    # 1. Find or Create Customer
    customer = db.query(Customer).filter(Customer.company_name == cust_data["companyName"]).first()
    if not customer:
        customer = db.query(Customer).filter(Customer.email == cust_data["email"]).first()
        if not customer:
            customer = Customer(
                company_name=cust_data["companyName"],
                email=cust_data["email"] or f"auto_{datetime.now().timestamp()}@temp.com",
                phone=cust_data["mobile"] or cust_data["telephone"],
                contact_person=cust_data["contact_person"],
                address=cust_data["address"]
            )
            db.add(customer)
            db.commit()
            db.refresh(customer)

    # 2. Create RFQ
    new_rfq = RFQ(
        customerId=customer.id,
        product=rfq_data["product"] or "Unknown Product",
        receivedDate=rfq_data["receivedDate"] or datetime.now().strftime("%Y-%m-%d"),
        status="pending",
        details=rfq_data["raw_details"],
        rfq_file_path=file_path
    )
    db.add(new_rfq)
    db.commit()
    db.refresh(new_rfq)

    return {
        "status": "success",
        "message": "RFQ uploaded and parsed successfully",
        "rfq_id": new_rfq.id,
        "customer_name": customer.company_name
    }

# 🔹 GET ALL RFQs
@router.get("")
def get_rfqs(db: Session = Depends(get_db)):
    rfqs = (
        db.query(
            RFQ.id,
            RFQ.customerId,
            Customer.company_name.label("customerName"),
            RFQ.product,
            RFQ.receivedDate,
            RFQ.status,
            RFQ.details,
            RFQ.rfq_file_path,
        )
        .join(Customer, RFQ.customerId == Customer.id)
        .filter(Customer.is_deleted == False, RFQ.is_deleted == False)
        .order_by(RFQ.id.desc())
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
            "details": r.details,
            "rfq_file_path": r.rfq_file_path,
        }
        for r in rfqs
    ]

# 🔹 CREATE RFQ
@router.post("")
def create_rfq(data: RFQCreate, db: Session = Depends(get_db)):
    new_rfq = RFQ(
        customerId=data.customerId,
        product=data.product,
        receivedDate=data.receivedDate,
        status="pending",
        details=data.details or {},
    )

    db.add(new_rfq)
    db.commit()
    db.refresh(new_rfq)

    customer = db.query(Customer).filter(Customer.id == data.customerId).first()

    return {
        "rfq": {
            "id": new_rfq.id,
            "customerId": new_rfq.customerId,
            "customerName": customer.company_name if customer else "",
            "product": new_rfq.product,
            "receivedDate": new_rfq.receivedDate,
            "status": new_rfq.status,
            "details": new_rfq.details,
        }
    }

# 🔹 GET RFQ BY ID
@router.get("/{id}")
def get_rfq(id: int, db: Session = Depends(get_db)):
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
        "status": rfq.status,
        "details": rfq.details,
        "rfq_file_path": rfq.rfq_file_path,
    }

# 🔹 DOWNLOAD UPLOADED FILE
@router.get("/{id}/download")
def download_rfq_file(id: int, db: Session = Depends(get_db)):
    rfq = db.query(RFQ).filter(RFQ.id == id, RFQ.is_deleted == False).first()
    if not rfq or not rfq.rfq_file_path:
        raise HTTPException(status_code=404, detail="File not found")
        
    if not os.path.exists(rfq.rfq_file_path):
        raise HTTPException(status_code=404, detail="File missing on server")

    return FileResponse(
        path=rfq.rfq_file_path,
        filename=os.path.basename(rfq.rfq_file_path),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

# 🔹 UPDATE RFQ STATUS
@router.patch("/{id}/status")
def update_rfq_status(id: int, body: RFQStatusUpdate, db: Session = Depends(get_db)):
    rfq = db.query(RFQ).filter(RFQ.id == id, RFQ.is_deleted == False).first()
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    rfq.status = body.status
    db.commit()
    return {"success": True, "status": rfq.status}

# 🔹 DELETE RFQ
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
    db.commit()
    return None
