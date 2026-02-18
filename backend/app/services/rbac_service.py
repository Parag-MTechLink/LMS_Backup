"""
RBAC service: permission checks and audit logging. No business logic.
"""
import logging
from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.permissions import has_permission
from app.models.user_model import AuditLog, User

logger = logging.getLogger(__name__)


def check_permission(role: str, permission: str) -> bool:
    """Return True if role has the permission."""
    return has_permission(role, permission)


def log_audit(
    db: Session,
    user_id: UUID | None,
    action: str,
    resource_type: str | None = None,
    resource_id: str | None = None,
    details: dict[str, Any] | None = None,
    ip_address: str | None = None,
) -> None:
    """Write an audit log entry. Does not commit."""
    entry = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address=ip_address,
    )
    db.add(entry)
    logger.info("Audit: action=%s user_id=%s resource=%s", action, user_id, resource_id)
