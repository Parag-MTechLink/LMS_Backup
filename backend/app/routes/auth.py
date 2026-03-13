"""
Authentication routes: signup, login, me. Delegate to auth_service; rate limit login.
"""
import logging
import time
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token
from app.dependencies.auth_dependency import get_current_user, get_current_user_optional
from app.models.user_model import User
from app.services.auth_service import (
    create_user, 
    authenticate_user, 
    get_all_users, 
    delete_user,
    create_password_reset_token,
    reset_password
)
from app.services.rbac_service import log_audit
from app.utils.email import send_password_reset_email

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/health")
def auth_health():
    """Confirm auth routes are loaded. Returns 200 if this app is the one serving /api/v1/auth."""
    return {"status": "ok", "service": "auth"}


_login_attempts: dict[str, List[float]] = {}
RATE_LIMIT_WINDOW = 60
RATE_LIMIT_MAX_ATTEMPTS = 5


def _check_login_rate_limit(email: str) -> None:
    now = time.time()
    key = email.strip().lower()
    if key not in _login_attempts:
        _login_attempts[key] = []
    _login_attempts[key] = [t for t in _login_attempts[key] if now - t < RATE_LIMIT_WINDOW]
    if len(_login_attempts[key]) >= RATE_LIMIT_MAX_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Try again later.",
        )
    _login_attempts[key].append(now)


class SignupRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str = "Testing Engineer"


class SignupResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    message: str = "Account created successfully."


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class MeResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool

class ResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    password: str


@router.post("/signup")
def signup(
    body: SignupRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """Register a new user. Only Admin can create Admin accounts."""
    created_by_admin = current_user is not None and current_user.role == "Admin"
    user, err = create_user(
        db,
        full_name=body.full_name,
        email=body.email,
        password=body.password,
        role=body.role.strip(),
        created_by_admin=created_by_admin,
    )
    if err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err)
    client_host = request.client.host if request.client else None
    log_audit(db, user.id, "user.create", "user", str(user.id), {"email": user.email}, client_host)
    db.commit()
    return SignupResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role,
    )


@router.post("/login")
def login(
    body: LoginRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Verify credentials and return JWT."""
    _check_login_rate_limit(body.email)
    try:
        user = authenticate_user(db, body.email, body.password)
    except SQLAlchemyError as e:
        logger.warning("Database error during login: %s", e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable. Please try again.",
        ) from e
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = create_access_token(user_id=str(user.id), role=user.role, email=user.email)
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user={
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
        },
    )


@router.get("/me", response_model=MeResponse)
def me(current_user: User = Depends(get_current_user)):
    """Return current authenticated user."""
    return MeResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
    )


@router.get("/users", response_model=List[MeResponse])
def get_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return all users in the system. Admin only."""
    if current_user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can view the user directory.",
        )
    users = get_all_users(db)
    return [
        MeResponse(
            id=str(u.id),
            email=u.email,
            full_name=u.full_name,
            role=u.role,
            is_active=u.is_active,
        )
        for u in users
    ]
@router.delete("/users/{user_id}")
def delete_user_route(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a user account. Admin only."""
    if current_user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can delete user accounts.",
        )
    
    # Optional: Prevent admin from deleting themselves
    if str(current_user.id) == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own admin account from here.",
        )

    from uuid import UUID
    try:
        success = delete_user(db, UUID(user_id))
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )
        
        log_audit(db, current_user.id, "user.delete", "user", user_id, {"deleted_by": str(current_user.id)})
        return {"message": "User deleted successfully."}
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format.",
        )

@router.post("/request-reset")
def request_password_reset(body: ResetRequest, db: Session = Depends(get_db)):
    """Generate a reset token and send email."""
    token = create_password_reset_token(db, body.email)
    
    # We return success even if user not found for security (prevent email enumeration)
    if token:
        send_password_reset_email(body.email, token)
        
    return {"message": "If an account exists with this email, a reset link has been sent."}

@router.post("/reset-password")
def perform_password_reset(body: PasswordReset, db: Session = Depends(get_db)):
    """Verify token and set new password."""
    success, message = reset_password(db, body.token, body.password)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
        
    return {"message": message}
