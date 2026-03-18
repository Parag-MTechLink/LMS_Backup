import sys
import os

# Add current directory to path for imports
sys.path.append(os.getcwd())

from app.core.database import SessionLocal
from app.models.user_model import User
from app.core.security import hash_password

def create_test_users():
    db = SessionLocal()
    roles = [
        "Sales Manager",
        "Technical Manager",
        "Finance Manager",
        "Project Manager",
        "Team Lead",
        "Quality Manager"
    ]
    
    password_hash = hash_password("Test@1234") # Standardized password for testing
    
    try:
        for role in roles:
            email = f"{role.lower().replace(' ', '.')}@example.com"
            existing = db.query(User).filter(User.email == email).first()
            if not existing:
                user = User(
                    full_name=f"Test {role}",
                    email=email,
                    password_hash=password_hash,
                    role=role,
                    is_main=False
                )
                db.add(user)
                print(f"Created user: {email} (Password: Test@1234)")
            else:
                print(f"User {email} already exists.")
        
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_test_users()
