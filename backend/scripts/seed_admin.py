"""
One-time script to create a default Admin user for development/login.
Run from backend directory: python scripts/seed_admin.py

Default credentials (change in production):
  Email: admin@lms.local
  Password: Admin@123
"""
import os
import sys

# Ensure backend root is on path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user_model import User


DEFAULT_EMAIL = "admin@lms.local"
DEFAULT_PASSWORD = "Admin@123"
DEFAULT_NAME = "Administrator"


def main():
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == DEFAULT_EMAIL).first()
        if existing:
            print(f"Admin user already exists: {DEFAULT_EMAIL}")
            print("Use the password you set when you created it, or reset it in the database.")
            return
        user = User(
            full_name=DEFAULT_NAME,
            email=DEFAULT_EMAIL,
            password_hash=hash_password(DEFAULT_PASSWORD),
            role="Admin",
            is_active=True,
        )
        db.add(user)
        db.commit()
        print("Default Admin user created successfully.")
        print(f"  Email:    {DEFAULT_EMAIL}")
        print(f"  Password: {DEFAULT_PASSWORD}")
        print("  Change this password after first login in production.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
