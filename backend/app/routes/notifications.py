"""
Notifications API routes.
Workflow-driven: other modules POST triggers; users GET their unread notifications.
"""
import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth_dependency import get_current_user
from app.models.user_model import User
from app.models.notification_model import Notification

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notifications", tags=["Notifications"])


# ─── Pydantic schemas ─────────────────────────────────────────────────────────

class NotificationOut(BaseModel):
    id: str
    recipient_role: str
    title: str
    message: str
    is_read: bool
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    entity_url: Optional[str] = None
    triggered_by_role: Optional[str] = None
    triggered_by_name: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True


class TriggerRequest(BaseModel):
    recipient_role: str          # Who should be notified (role name)
    title: str
    message: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    entity_url: Optional[str] = None


# ─── Helper ───────────────────────────────────────────────────────────────────

def create_notification(
    db: Session,
    recipient_role: str,
    title: str,
    message: str,
    triggered_by: User,
    entity_type: str = None,
    entity_id: str = None,
    entity_url: str = None,
) -> Notification:
    """Create and persist a new notification. Call from any workflow action."""
    n = Notification(
        recipient_role=recipient_role,
        title=title,
        message=message,
        entity_type=entity_type,
        entity_id=entity_id,
        entity_url=entity_url,
        triggered_by_role=triggered_by.role if triggered_by else None,
        triggered_by_name=triggered_by.full_name if triggered_by else None,
    )
    db.add(n)
    db.flush()
    logger.info("Notification created → role=%s title=%s", recipient_role, title)
    return n


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.get("", response_model=List[NotificationOut])
def get_my_notifications(
    unread_only: bool = True,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Fetch notifications for the authenticated user's role.
    Admin sees all notifications.
    """
    query = db.query(Notification)

    if current_user.role != "Admin":
        query = query.filter(Notification.recipient_role == current_user.role)

    if unread_only:
        query = query.filter(Notification.is_read == False)  # noqa: E712

    notifications = query.order_by(Notification.created_at.desc()).limit(limit).all()

    return [
        NotificationOut(
            id=str(n.id),
            recipient_role=n.recipient_role,
            title=n.title,
            message=n.message,
            is_read=n.is_read,
            entity_type=n.entity_type,
            entity_id=n.entity_id,
            entity_url=n.entity_url,
            triggered_by_role=n.triggered_by_role,
            triggered_by_name=n.triggered_by_name,
            created_at=n.created_at.isoformat() if n.created_at else "",
        )
        for n in notifications
    ]


@router.get("/count")
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return count of unread notifications for the current user's role."""
    query = db.query(Notification).filter(Notification.is_read == False)  # noqa: E712

    if current_user.role != "Admin":
        query = query.filter(Notification.recipient_role == current_user.role)

    count = query.count()
    return {"count": count}


@router.patch("/{notification_id}/read")
def mark_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a specific notification as read."""
    from uuid import UUID
    try:
        nid = UUID(notification_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid notification ID.")

    n = db.query(Notification).filter(Notification.id == nid).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found.")

    n.is_read = True
    db.commit()
    return {"message": "Marked as read."}


@router.patch("/mark-all-read")
def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark all notifications for the current role as read."""
    query = db.query(Notification).filter(
        Notification.is_read == False,  # noqa: E712
    )
    if current_user.role != "Admin":
        query = query.filter(Notification.recipient_role == current_user.role)

    updated = query.update({"is_read": True}, synchronize_session=False)
    db.commit()
    return {"message": f"{updated} notifications marked as read."}


@router.post("/trigger", status_code=status.HTTP_201_CREATED)
def trigger_workflow_notification(
    body: TriggerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Called by frontend after a workflow step is completed.
    Creates a notification for the next role in the workflow.
    """
    n = create_notification(
        db=db,
        recipient_role=body.recipient_role,
        title=body.title,
        message=body.message,
        triggered_by=current_user,
        entity_type=body.entity_type,
        entity_id=body.entity_id,
        entity_url=body.entity_url,
    )
    return {"id": str(n.id), "message": "Notification created."}
