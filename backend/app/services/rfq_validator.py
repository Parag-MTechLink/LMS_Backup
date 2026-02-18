"""
Business rule validation for canonical RFQ.
No schema validation here; no parsing. Input is already canonical JSON.
"""
import logging
from datetime import date, timedelta
from typing import Any

logger = logging.getLogger(__name__)

URGENT_DEADLINE_DAYS = 3


def validate_business_rules(data: dict[str, Any]) -> dict[str, Any]:
    """
    Apply business rules only.
    Returns { "is_valid": bool, "errors": list[str] }.
    """
    errors: list[str] = []

    # Required fields not empty strings (after schema, but double-check)
    for key in ("company_name", "contact_person", "email", "project_title"):
        val = data.get(key)
        if val is None or (isinstance(val, str) and not val.strip()):
            errors.append(f"{key} must not be empty")

    # Deadline > today
    deadline_val = data.get("deadline")
    if deadline_val:
        try:
            d = date.fromisoformat(deadline_val) if isinstance(deadline_val, str) else deadline_val
            if d <= date.today():
                errors.append("deadline must be after today")
            # If urgent_flag: deadline within 3 days
            if data.get("urgent_flag") is True:
                max_allowed = date.today() + timedelta(days=URGENT_DEADLINE_DAYS)
                if d > max_allowed:
                    errors.append(f"urgent RFQ deadline must be within {URGENT_DEADLINE_DAYS} days")
        except (TypeError, ValueError):
            errors.append("deadline (invalid date)")

    # sample_quantity > 0
    sample_qty = data.get("sample_quantity")
    if sample_qty is not None:
        try:
            n = int(sample_qty) if not isinstance(sample_qty, int) else sample_qty
            if n <= 0:
                errors.append("sample_quantity must be greater than 0")
        except (TypeError, ValueError):
            errors.append("sample_quantity must be a positive integer")

    # test_items quantity matches sample_quantity (sum of quantities)
    test_items = data.get("test_items") or []
    if test_items:
        total = 0
        for i, row in enumerate(test_items):
            q = row.get("quantity")
            if q is not None:
                try:
                    total += float(q)
                except (TypeError, ValueError):
                    errors.append(f"test_items[{i}].quantity must be a number")
        if not errors and "sample_quantity" in data:
            try:
                sq = int(data["sample_quantity"]) if not isinstance(data["sample_quantity"], int) else data["sample_quantity"]
                if abs(total - sq) > 0.01:  # allow small float difference
                    errors.append("sum of test_items quantities should match sample_quantity")
            except (TypeError, ValueError):
                pass

    is_valid = len(errors) == 0
    if not is_valid:
        logger.info("Business validation failed: %s", errors)
    return {"is_valid": is_valid, "errors": errors}
