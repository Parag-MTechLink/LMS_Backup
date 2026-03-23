"""
Sync Excel-upload RFQ to the main rfqs list: find or create Customer, create RFQ row
so the uploaded request appears on the RFQs page.
"""
from datetime import date
from typing import Any

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.rfq_model import RFQRequest
from app.modules.projects.models import Customer
from app.modules.rfqs.models import RFQ


def sync_rfq_to_list(db: Session, canonical: dict[str, Any], rfq_request: RFQRequest) -> RFQ | None:
    """
    After a successful Excel upload (RFQRequest created), create or link the RFQ
    so it appears in the main RFQs list. Finds Customer by email or creates one.
    Returns the created RFQ or None on failure.
    """
    email = (canonical.get("email") or "").strip()
    company_name = (canonical.get("company_name") or "").strip() or "Unknown"
    if not email:
        return None

    customer = db.query(Customer).filter(Customer.email == email, Customer.is_deleted == False).first()
    if not customer:
        customer = Customer(
            company_name=company_name,
            email=email,
            phone=(canonical.get("phone") or "").strip() or None,
            contact_person=(canonical.get("contact_person") or "").strip() or None,
            status="active",
        )
        db.add(customer)
        try:
            db.flush()
        except IntegrityError:
            db.rollback()
            customer = db.query(Customer).filter(Customer.email == email).first()
            if not customer:
                return None

    product = (canonical.get("project_title") or "").strip() or "From Excel"
    received_date = date.today().isoformat()

    rfq = RFQ(
        customerId=customer.id,
        product=product,
        receivedDate=received_date,
        status="pending",
    )
    db.add(rfq)
    db.flush()
    return rfq
