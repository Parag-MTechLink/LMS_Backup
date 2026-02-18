"""
Password hashing and JWT creation/verification. No business logic.
Uses bcrypt directly to avoid passlib/bcrypt version conflicts (e.g. bcrypt 4.x + Python 3.14).
"""
import re
from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
import jwt

from app.core.config import settings

# bcrypt limit; longer passwords are truncated to avoid ValueError
BCRYPT_MAX_PASSWORD_BYTES = 72

# Strong password: min 8 chars, at least one letter and one number
PASSWORD_MIN_LENGTH = 8
PASSWORD_PATTERN = re.compile(r"^(?=.*[A-Za-z])(?=.*\d).{8,}$")


def _password_bytes(plain: str) -> bytes:
    """Encode password for bcrypt; truncate to 72 bytes to satisfy bcrypt limit."""
    raw = plain.encode("utf-8")
    if len(raw) > BCRYPT_MAX_PASSWORD_BYTES:
        raw = raw[:BCRYPT_MAX_PASSWORD_BYTES]
    return raw


def hash_password(plain: str) -> str:
    """Hash a plain password. Never store plain passwords."""
    return bcrypt.hashpw(_password_bytes(plain), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify plain password against hash."""
    return bcrypt.checkpw(_password_bytes(plain), hashed.encode("utf-8"))


def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Enforce strong password. Returns (is_valid, error_message).
    """
    if len(password) < PASSWORD_MIN_LENGTH:
        return False, f"Password must be at least {PASSWORD_MIN_LENGTH} characters."
    if not PASSWORD_PATTERN.match(password):
        return False, "Password must contain at least one letter and one number."
    return True, ""


def create_access_token(
    user_id: str,
    role: str,
    email: str,
    expires_delta: timedelta | None = None,
) -> str:
    """Create JWT with user_id, role, email, iat, exp."""
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    payload = {
        "sub": str(user_id),
        "role": role,
        "email": email,
        "iat": now,
        "exp": expire,
        "type": "access",
    }
    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_access_token(token: str) -> dict[str, Any] | None:
    """
    Decode and validate JWT. Returns payload dict or None if invalid/expired.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        if payload.get("type") != "access":
            return None
        return payload
    except jwt.PyJWTError:
        return None
