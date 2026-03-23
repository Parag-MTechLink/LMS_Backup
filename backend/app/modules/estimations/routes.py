from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.modules.estimations.models import Estimation, EstimationTestItem
from app.modules.estimations.schemas import EstimationCreate, EstimationOut, EstimationReview, TestTypeOut
from app.modules.rfqs.models import RFQ
from app.modules.projects.models import Customer
import uuid
from typing import List

router = APIRouter(prefix="/estimations", tags=["Estimations"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 🔹 GET ALL ESTIMATIONS
@router.get("", response_model=List[EstimationOut])
def get_estimations(db: Session = Depends(get_db)):
    estimations = db.query(Estimation).all()
    
    response = []
    
    for e in estimations:
        rfq = db.query(RFQ).filter(RFQ.id == e.rfqId).first()
        customer = db.query(Customer).filter(Customer.id == rfq.customerId).first() if rfq else None
        
        # Load test items manually if not using relationships
        items = db.query(EstimationTestItem).filter(EstimationTestItem.estimationId == e.id).all()

        est_dict = {
            "id": e.id,
            "rfqId": e.rfqId,
            "estimationId": e.estimationId,
            "version": e.version,
            "totalCost": e.totalCost,
            "totalHours": e.totalHours,
            "margin": e.margin,
            "discount": e.discount,
            "notes": e.notes,
            "status": e.status,
            "items": items,
            "rfqCustomerName": customer.company_name if customer else "",
            "rfqProduct": rfq.product if rfq else "",
        }
        response.append(est_dict)

    return response

# 🔹 GET ESTIMATION BY ID
@router.get("/{id}", response_model=EstimationOut)
def get_estimation(id: int, db: Session = Depends(get_db)):
    e = db.query(Estimation).filter(Estimation.id == id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Estimation not found")

    rfq = db.query(RFQ).filter(RFQ.id == e.rfqId).first()
    customer = db.query(Customer).filter(Customer.id == rfq.customerId).first() if rfq else None
    items = db.query(EstimationTestItem).filter(EstimationTestItem.estimationId == e.id).all()

    return {
        "id": e.id,
        "rfqId": e.rfqId,
        "estimationId": e.estimationId,
        "version": e.version,
        "totalCost": e.totalCost,
        "totalHours": e.totalHours,
        "margin": e.margin,
        "discount": e.discount,
        "notes": e.notes,
        "status": e.status,
        "items": items,
        "rfqCustomerName": customer.company_name if customer else "",
        "rfqProduct": rfq.product if rfq else "",
    }

# 🔹 GET TEST TYPES (Hardcoded for now)
@router.get("/test-types", response_model=List[TestTypeOut])
def get_test_types():
    return [
        {"id": 1, "name": "EMC Testing", "hsnCode": "9030", "defaultRate": 5000},
        {"id": 2, "name": "RF Testing", "hsnCode": "9030", "defaultRate": 6000},
        {"id": 3, "name": "Safety Testing", "hsnCode": "9030", "defaultRate": 4500},
    ]

# 🔹 CREATE ESTIMATION
@router.post("")
def create_estimation(data: EstimationCreate, db: Session = Depends(get_db)):
    # 🔸 calculate totals
    total_hours = sum(t.hours * t.numberOfDUT for t in data.tests)
    subtotal = sum(t.hours * t.ratePerHour * t.numberOfDUT for t in data.tests)

    with_margin = subtotal * (1 + data.margin / 100)
    total_cost = with_margin * (1 - data.discount / 100)

    estimation = Estimation(
        rfqId=data.rfqId,
        estimationId=f"EST-{uuid.uuid4().hex[:6].upper()}",
        version=1,
        totalCost=total_cost,
        totalHours=total_hours,
        margin=data.margin,
        discount=data.discount,
        notes=data.notes,
        status="draft",
    )

    db.add(estimation)
    db.commit()
    db.refresh(estimation)

    # 🔸 save test items
    for item in data.tests:
        db.add(
            EstimationTestItem(
                estimationId=estimation.id,
                testTypeId=item.testTypeId,
                numberOfDUT=item.numberOfDUT,
                hours=item.hours,
                ratePerHour=item.ratePerHour,
                remarks=item.remarks,
            )
        )

    db.commit()

    return {"success": True, "estimationId": estimation.id}

# 🔹 REVIEW ESTIMATION
@router.post("/{id}/review")
def review_estimation(id: int, review: EstimationReview, db: Session = Depends(get_db)):
    estimation = db.query(Estimation).filter(Estimation.id == id).first()
    if not estimation:
        raise HTTPException(status_code=404, detail="Estimation not found")
    
    estimation.status = review.status
    # If comments field exists in model, save it. Assuming it might not, so skipping for now or adding if model allows.
    # Looking at model, there is no 'comments' field, only 'notes'. 
    # If review comments are critical, model update is needed. 
    # For now, I'll append to notes if comments exist.
    if review.comments:
        current_notes = estimation.notes or ""
        estimation.notes = f"{current_notes}\n[Review]: {review.comments}".strip()

    db.commit()
    return {"success": True, "status": estimation.status}
