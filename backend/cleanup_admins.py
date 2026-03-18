import sys
import os

# Add current directory to path for imports
sys.path.append(os.getcwd())

from app.core.database import SessionLocal
from app.models.user_model import User

def cleanup_admins():
    db = SessionLocal()
    try:
        admins = db.query(User).filter(User.role == "Admin").order_by(User.created_at.asc()).all()
        if not admins:
            print("No admin accounts found.")
            return

        print(f"Found {len(admins)} admin accounts.")
        
        # Keep the first primary admin if exists, otherwise the first admin
        primary_admin = next((u for u in admins if u.is_main), admins[0])
        
        # Ensure it's marked as main
        if not primary_admin.is_main:
            primary_admin.is_main = True
            db.add(primary_admin)
            print(f"Promoted {primary_admin.email} to Primary Admin.")
        
        # Delete everyone else with Admin role
        deleted_count = 0
        for u in admins:
            if u.id != primary_admin.id:
                print(f"Deleting admin: {u.email} (Main: {u.is_main})")
                db.delete(u)
                deleted_count += 1
        
        db.commit()
        print(f"Cleanup complete. Deleted {deleted_count} admins. Primary Admin: {primary_admin.email}")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_admins()
