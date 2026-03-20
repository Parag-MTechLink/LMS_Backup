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
    generate_mfa_code,
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
    creator_user: User | None = None,
    is_main: bool = False,
) -> tuple[User | None, str]:
    """
    Create a new user. Returns (user, error_message).
    If error_message is non-empty, user is None.
    Admin hierarchy:
      - First user ever becomes Primary Admin (is_main=True, role=Admin).
      - Only Primary Admin (is_main=True, role=Admin) can create other Admins.
      - Maximum 2 sub-admins (is_main=False, role=Admin) allowed system-wide.
    """
    email = email.strip().lower()
    if not email or "@" not in email:
        return None, "Invalid email address."

    role = role.strip()
    if role not in ROLES:
        return None, f"Invalid role. Must be one of: {', '.join(ROLES)}."

    existing_admins = db.query(User).filter(User.role == "Admin").count()

    # ── Admin creation rules ──────────────────────────────────────────────────
    if role == "Admin":
        if existing_admins == 0:
            # Bootstrap: if no admin exists, the first admin created becomes primary
            is_main = True
        else:
            # Must be created by Primary Admin
            if not creator_user or creator_user.role != "Admin" or not creator_user.is_main:
                return None, "Only the Primary Admin can create additional Admin accounts."
            # Count existing sub-admins (is_main=False, role=Admin)
            sub_admin_count = db.query(User).filter(
                User.role == "Admin",
                User.is_main == False,  # noqa: E712
            ).count()
            if sub_admin_count >= 2:
                return None, "Admin limit reached. Only 2 sub-admins are allowed under the Primary Admin."
            is_main = False  # sub-admins are never is_main

    # ── Project Manager creation rules ────────────────────────────────────────
    elif role == "Project Manager" and db.query(User).count() > 0:
        if creator_user and creator_user.role == "Project Manager":
            sub_pm_count = db.query(User).filter(
                User.role == "Project Manager",
                User.parent_id == creator_user.id
            ).count()
            if sub_pm_count >= 2:
                return None, "You have reached your limit of 2 subordinate Project Managers."
        elif not creator_user or creator_user.role not in ["Project Manager", "Admin"]:
            return None, "Only Project Managers or Admins can add Project Managers."

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
        is_main=is_main,
        parent_id=creator_user.id if creator_user else None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info("User created: id=%s email=%s role=%s is_main=%s", user.id, user.email, user.role, user.is_main)
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

def create_mfa_code(db: Session, email: str) -> str | None:
    """
    Generate a 6-digit MFA code for the user and save it to the DB with expiry.
    Returns the code if successful, else None.
    """
    user = get_user_by_email(db, email)
    if not user:
        return None
    
    code = generate_mfa_code()
    user.mfa_code = code
    # MFA code expires in 5 minutes
    user.mfa_code_expires = datetime.utcnow() + timedelta(minutes=5)
    
    db.commit()
    return code

def verify_mfa_code(db: Session, email: str, code: str) -> User | None:
    """
    Validate the MFA code and return the user if successful.
    Clears the code upon success.
    """
    user = get_user_by_email(db, email)
    if not user:
        return None
    
    if not user.mfa_code or user.mfa_code != code:
        return None
    
    if user.mfa_code_expires < datetime.utcnow():
        # Clear expired code
        user.mfa_code = None
        user.mfa_code_expires = None
        db.commit()
        return None
    
    # Success: clear code and return user
    user.mfa_code = None
    user.mfa_code_expires = None
    db.commit()
    return user

def update_user_profile(db: Session, user_id: str, profile_data: dict) -> tuple[User | None, str]:
    """
    Update user profile fields.
    """
    user = get_user_by_id(db, UUID(user_id))
    if not user:
        return None, "User not found."

    # Update fields if present in profile_data
    allowed_fields = [
        "full_name", "gender", "country", "language", "address", 
        "company_name", "phone_no", "designation", "industry", "account_type"
    ]
    
    for field in allowed_fields:
        if field in profile_data:
            setattr(user, field, profile_data[field])
    
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user, ""

def change_user_password(db: Session, user_id: str, current_password: str, new_password: str) -> tuple[bool, str]:
    """
    Change user password after verifying current password.
    """
    user = get_user_by_id(db, UUID(user_id))
    if not user:
        return False, "User not found."

    if not verify_password(current_password, user.password_hash):
        return False, "Incorrect current password."

    valid, msg = validate_password_strength(new_password)
    if not valid:
        return False, msg

    if verify_password(new_password, user.password_hash):
        return False, "New password cannot be same as current password."

    user.password_hash = hash_password(new_password)
    user.updated_at = datetime.utcnow()
    db.commit()
    return True, "Password changed successfully."
