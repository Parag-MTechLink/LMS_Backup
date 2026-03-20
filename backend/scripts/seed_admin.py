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
            if existing.role != "Project Manager" or not existing.is_main:
                existing.role = "Project Manager"
                existing.is_main = True
                db.commit()
                print(f"Updated existing user to main Project Manager: {DEFAULT_EMAIL}")
            else:
                print(f"User already exists as main Project Manager: {DEFAULT_EMAIL}")
            return
        user = User(
            full_name=DEFAULT_NAME,
            email=DEFAULT_EMAIL,
            password_hash=hash_password(DEFAULT_PASSWORD),
            role="Project Manager",
            is_active=True,
            is_main=True,
        )
        db.add(user)
        db.commit()
        print("Default main Project Manager user created successfully.")
        print(f"  Email:    {DEFAULT_EMAIL}")
        print(f"  Password: {DEFAULT_PASSWORD}")
        print("  Change this password after first login in production.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
