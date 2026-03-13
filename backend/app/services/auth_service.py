"""
Authentication service: signup, login, user lookup. No route logic.
"""
import logging
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.security import (
    hash_password,
    validate_password_strength,
    verify_password,
)
from app.models.user_model import User, ROLES

logger = logging.getLogger(__name__)


def get_user_by_email(db: Session, email: str) -> User | None:
    """Return user by email or None."""
    return db.query(User).filter(User.email == email.strip().lower()).first()


def get_user_by_id(db: Session, user_id: UUID) -> User | None:
    """Return user by id or None."""
    return db.query(User).filter(User.id == user_id).first()


def delete_user(db: Session, user_id: UUID) -> bool:
    """Delete a user by ID. Returns True if successful."""
    user = get_user_by_id(db, user_id)
    if user:
        db.delete(user)
        db.commit()
        return True
    return False


def get_all_users(db: Session) -> list[User]:
    """Return all users."""
    return db.query(User).order_by(User.created_at.desc()).all()


def create_user(
    db: Session,
    full_name: str,
    email: str,
    password: str,
    role: str,
    created_by_admin: bool = False,
) -> tuple[User | None, str]:
    """
    Create a new user. Returns (user, error_message).
    If error_message is non-empty, user is None.
    Only Admin can create Admin role unless created_by_admin is True (bootstrap).
    """
    email = email.strip().lower()
    if not email or "@" not in email:
        return None, "Invalid email address."

    role = role.strip()
    if role not in ROLES:
        return None, f"Invalid role. Must be one of: {', '.join(ROLES)}."

    # Limit to 3 Admin accounts
    if role == "Admin":
        admin_count = db.query(User).filter(User.role == "Admin").count()
        if admin_count >= 3:
            return None, "Maximum limit of 3 Admin accounts has been reached."

    # Bootstrap: allow first user to be Admin when no users exist
    admin_ok = created_by_admin or (role == "Admin" and db.query(User).count() == 0)
    if role == "Admin" and not admin_ok:
        return None, "Only an existing Admin can create Admin accounts."

    valid, msg = validate_password_strength(password)
    if not valid:
        return None, msg

    existing = get_user_by_email(db, email)
    if existing:
        return None, "An account with this email already exists."

    user = User(
        full_name=full_name.strip() or email,
        email=email,
        password_hash=hash_password(password),
        role=role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info("User created: id=%s email=%s role=%s", user.id, user.email, user.role)
    return user, ""


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    """
    Verify email/password and return User if valid and active.
    """
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not user.is_active:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


import secrets
from app.core.config import settings
from datetime import datetime, timedelta

def create_password_reset_token(db: Session, email: str) -> str | None:
    """
    Generate a reset token for the user and save it to the DB.
    Returns the token if successful, else None.
    """
    user = get_user_by_email(db, email)
    if not user:
        return None
    
    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expires = datetime.utcnow() + timedelta(minutes=settings.RESET_TOKEN_EXPIRE_MINUTES)
    
    db.commit()
    return token

def reset_password(db: Session, token: str, new_password: str) -> tuple[bool, str]:
    """
    Verify token and update user password.
    Returns (success, message).
    """
    user = db.query(User).filter(User.reset_token == token).first()
    
    if not user:
        return False, "Invalid or expired reset token."
    
    if user.reset_token_expires < datetime.utcnow():
        # Clear expired token
        user.reset_token = None
        user.reset_token_expires = None
        db.commit()
        return False, "Reset token has expired."
    
    # Validate new password strength
    valid, msg = validate_password_strength(new_password)
    if not valid:
        return False, msg
    
    # NEW: Prevent resetting to the current password
    if verify_password(new_password, user.password_hash):
        return False, "New password cannot be the same as your current password."
    
    # Update password and clear token
    user.password_hash = hash_password(new_password)
    user.reset_token = None
    user.reset_token_expires = None
    
    db.commit()
    return True, "Password has been reset successfully."
