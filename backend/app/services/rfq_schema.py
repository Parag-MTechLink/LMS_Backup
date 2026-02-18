"""
Strict JSON Schema validation for canonical RFQ object.
Type enforcement, required fields, formats. No business rules here.
"""
import logging
from typing import Any

import jsonschema

logger = logging.getLogger(__name__)

RFQ_CANONICAL_SCHEMA = {
    "type": "object",
    "required": [
        "company_name",
        "contact_person",
        "email",
        "phone",
        "project_title",
        "testing_type",
        "sample_quantity",
        "deadline",
        "test_items",
    ],
    "properties": {
        "company_name": {"type": "string", "minLength": 1},
        "contact_person": {"type": "string", "minLength": 1},
        "email": {
            "type": "string",
            "minLength": 1,
            "format": "email",
        },
        "phone": {"type": "string"},
        "project_title": {"type": "string", "minLength": 1},
        "testing_type": {"type": "string"},
        "sample_quantity": {"type": "integer", "minimum": 0},
        "deadline": {"type": "string", "format": "date"},
        "urgent_flag": {"type": "boolean"},
        "test_items": {
            "type": "array",
            "minItems": 1,
            "items": {
                "type": "object",
                "required": ["test_name", "standard", "quantity"],
                "properties": {
                    "test_name": {"type": "string"},
                    "standard": {"type": "string"},
                    "quantity": {"type": "number", "minimum": 0.0001},
                },
            },
        },
    },
    "additionalProperties": True,
}


def validate_canonical_rfq(data: dict[str, Any]) -> tuple[bool, list[str]]:
    """
    Validate canonical RFQ against JSON Schema.
    Returns (is_valid, list of error messages).
    """
    format_checker = jsonschema.draft7_format_checker
    validator = jsonschema.Draft7Validator(RFQ_CANONICAL_SCHEMA, format_checker=format_checker)
    errors: list[str] = []
    for err in validator.iter_errors(data):
        path = ".".join(str(p) for p in err.absolute_path) if err.absolute_path else ""
        if path:
            errors.append(f"{path}: {err.message}")
        else:
            errors.append(err.message)
    if errors:
        logger.info("Schema validation failed: %s", errors)
        return False, errors
    return True, []
