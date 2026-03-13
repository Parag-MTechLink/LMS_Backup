"""
RFQ workflow: insert into DB only after validation.
No parsing, no validation logic here. Receives canonical JSON and validation results.
"""
import logging
from datetime import date
from typing import Any

from sqlalchemy.orm import Session

from app.models.rfq_model import RFQRequest

logger = logging.getLogger(__name__)


def execute_workflow(
    db: Session,
    canonical: dict[str, Any],
    schema_errors: list[str],
    business_result: dict[str, Any],
) -> tuple[str, list[str], RFQRequest]:
    """
    Insert RFQ request. No validation or parsing.
    If schema_errors or business errors: status = Incomplete, store errors.
    If both pass: status = Pending Review, assign to Lab Manager (when available).
    Always stores raw extracted JSON (canonical) in extracted_data.
    Returns (status, errors, rfq_request).
    """
    all_errors = list(schema_errors) if schema_errors else []
    if not business_result.get("is_valid"):
        all_errors.extend(business_result.get("errors") or [])

    is_valid = len(schema_errors) == 0 and business_result.get("is_valid") is True

    deadline_val = canonical.get("deadline")
    deadline_date = None
    if deadline_val:
        try:
            deadline_date = date.fromisoformat(deadline_val) if isinstance(deadline_val, str) else deadline_val
        except (TypeError, ValueError):
            pass

    # Map canonical to model fields (project_title -> project_type, test_items -> sample_details)
    rfq = RFQRequest(
        company_name=(canonical.get("company_name") or "").strip() or None,
        contact_person=(canonical.get("contact_person") or "").strip() or None,
        email=(canonical.get("email") or "").strip() or None,
        phone=(canonical.get("phone") or "").strip() or None,
        project_type=(canonical.get("project_title") or "").strip() or None,
        sample_details=canonical.get("test_items"),
        deadline=deadline_date,
        extracted_data=canonical,
        validation_status="valid" if is_valid else "invalid",
        missing_fields=all_errors if all_errors else None,
        status="Pending Review" if is_valid else "Incomplete",
        assigned_to=None,
    )

    db.add(rfq)
    db.commit()
    db.refresh(rfq)

    if is_valid:
        logger.info("RFQ request %s set to Pending Review; assign to Project Manager if needed.", rfq.id)
    else:
        logger.info("RFQ request %s set to Incomplete; errors: %s", rfq.id, all_errors)

    return rfq.status, all_errors, rfq
