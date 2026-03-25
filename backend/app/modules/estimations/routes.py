from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, aliased
from app.core.database import SessionLocal
from app.modules.estimations.models import Estimation, EstimationTestItem, TestType
from app.modules.estimations.schemas import EstimationCreate, EstimationOut, EstimationReview, TestTypeOut, TestTypeHierarchy
from app.modules.estimations.rate_chart_parser import parse_rate_chart_pdf
from fastapi import UploadFile, File
import shutil
import tempfile

from app.modules.rfqs.models import RFQ
from app.modules.projects.models import Customer
import uuid
from typing import List
import os

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
    # Join with RFQ and Customer to get required names efficiently
    results = (
        db.query(
            Estimation,
            Customer.company_name.label("rfqCustomerName"),
            RFQ.product.label("rfqProduct")
        )
        .join(RFQ, Estimation.rfqId == RFQ.id)
        .join(Customer, RFQ.customerId == Customer.id)
        .order_by(Estimation.id.desc())
        .all()
    )
    
    response = []
    
    for e, customer_name, rfq_product in results:
        # Load test items with names (including category)
        SubTest = aliased(TestType)
        Category = aliased(TestType)
        
        items_with_names = (
            db.query(
                EstimationTestItem,
                SubTest.name.label("testName"),
                Category.name.label("categoryName")
            )
            .join(SubTest, EstimationTestItem.testTypeId == SubTest.id)
            .outerjoin(Category, SubTest.parentId == Category.id)
            .filter(EstimationTestItem.estimationId == e.id)
            .all()
        )

        items = []
        subtotal = 0
        for item, test_name, category_name in items_with_names:
            full_test_name = f"{category_name} - {test_name}" if category_name else test_name
            item_subtotal = item.hours * item.ratePerHour * item.numberOfDUT
            subtotal += item_subtotal
            item_dict = {
                "id": item.id,
                "estimationId": item.estimationId,
                "testTypeId": item.testTypeId,
                "numberOfDUT": item.numberOfDUT,
                "hours": item.hours,
                "ratePerHour": item.ratePerHour,
                "remarks": item.remarks,
                "testTypeName": full_test_name
            }
            items.append(item_dict)

        est_dict = {
            "id": e.id,
            "rfqId": e.rfqId,
            "estimationId": e.estimationId,
            "version": e.version,
            "totalCost": e.totalCost,
            "totalHours": e.totalHours,
            "subtotal": subtotal,
            "margin": e.margin,
            "discount": e.discount,
            "notes": e.notes,
            "details": e.details or {},
            "status": e.status,
            "items": items,
            "rfqCustomerName": customer_name,
            "rfqProduct": rfq_product,
        }
        response.append(est_dict)

    return response

# 🔹 UPLOAD RATE CHART
@router.post("/rate-chart/upload")
async def upload_rate_chart(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Save to temp file
    suffix = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        # Parse based on extension
        if suffix.lower() == ".pdf":
            parsed_data = parse_rate_chart_pdf(tmp_path)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload a PDF.")

        # Clear existing test types (Optional: or update)
        # For simplicity, we clear and re-populate
        db.query(TestType).delete()
        
        for cat in parsed_data:
            parent = TestType(
                name=cat['name'],
                hsnCode=cat['hsnCode'],
                defaultRate=cat['defaultRate'],
                unit=cat['unit'],
                parentId=None
            )
            db.add(parent)
            db.flush() # Get parent.id
            
            for child in cat['children']:
                db.add(TestType(
                    name=child['name'],
                    hsnCode=child['hsnCode'],
                    defaultRate=child['defaultRate'],
                    unit=child['unit'],
                    parentId=parent.id
                ))
        
        db.commit()
        return {"success": True, "count": len(parsed_data)}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to parse rate chart: {str(e)}")
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

# 🔹 GET TEST TYPES (Dynamic)
@router.get("/test-types", response_model=List[TestTypeOut])
def get_test_types(db: Session = Depends(get_db)):
    return db.query(TestType).all()

# 🔹 GET TEST TYPES HIERARCHY
@router.get("/test-types/hierarchy", response_model=List[TestTypeHierarchy])
def get_test_types_hierarchy(db: Session = Depends(get_db)):
    # Fetch all
    all_types = db.query(TestType).all()
    
    # Build tree
    type_map = {t.id: TestTypeHierarchy.from_orm(t) for t in all_types}
    root_nodes = []
    
    for t in all_types:
        if t.parentId is None:
            root_nodes.append(type_map[t.id])
        else:
            parent = type_map.get(t.parentId)
            if parent:
                parent.children.append(type_map[t.id])
                
    return root_nodes

# 🔹 GET ESTIMATION BY ID
@router.get("/{id}", response_model=EstimationOut)
def get_estimation(id: int, db: Session = Depends(get_db)):
    e = db.query(Estimation).filter(Estimation.id == id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Estimation not found")

    rfq = db.query(RFQ).filter(RFQ.id == e.rfqId).first()
    customer = db.query(Customer).filter(Customer.id == rfq.customerId).first() if rfq else None
    
    # Load items with test names (including category)
    SubTest = aliased(TestType)
    Category = aliased(TestType)

    items_with_names = (
        db.query(
            EstimationTestItem,
            SubTest.name.label("testName"),
            Category.name.label("categoryName")
        )
        .join(SubTest, EstimationTestItem.testTypeId == SubTest.id)
        .outerjoin(Category, SubTest.parentId == Category.id)
        .filter(EstimationTestItem.estimationId == e.id)
        .all()
    )

    items = []
    subtotal = 0
    for item, test_name, category_name in items_with_names:
        full_test_name = f"{category_name} - {test_name}" if category_name else test_name
        item_subtotal = item.hours * item.ratePerHour * item.numberOfDUT
        subtotal += item_subtotal
        item_dict = {
            "id": item.id,
            "estimationId": item.estimationId,
            "testTypeId": item.testTypeId,
            "numberOfDUT": item.numberOfDUT,
            "hours": item.hours,
            "ratePerHour": item.ratePerHour,
            "remarks": item.remarks,
            "testTypeName": full_test_name
        }
        items.append(item_dict)

    return {
        "id": e.id,
        "rfqId": e.rfqId,
        "estimationId": e.estimationId,
        "version": e.version,
        "totalCost": e.totalCost,
        "totalHours": e.totalHours,
        "subtotal": subtotal,
        "margin": e.margin,
        "discount": e.discount,
        "notes": e.notes,
        "details": e.details or {},
        "status": e.status,
        "items": items,
        "rfqCustomerName": customer.company_name if customer else "",
        "rfqProduct": rfq.product if rfq else "",
    }

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
        details=data.details or {},
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

# 🔹 DELETE ESTIMATION
@router.delete("/{id}")
def delete_estimation(id: int, db: Session = Depends(get_db)):
    estimation = db.query(Estimation).filter(Estimation.id == id).first()
    if not estimation:
        raise HTTPException(status_code=404, detail="Estimation not found")
    
    # 🔸 Delete test items first
    db.query(EstimationTestItem).filter(EstimationTestItem.estimationId == id).delete()
    
    # 🔸 Delete estimation
    db.delete(estimation)
    db.commit()
    
    return {"success": True, "message": "Estimation deleted successfully"}
