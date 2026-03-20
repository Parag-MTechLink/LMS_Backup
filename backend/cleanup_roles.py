from app.core.database import SessionLocal, get_connect_args
from app.models.user_model import User
from app.core.config import settings

def cleanup_roles():
    db = SessionLocal()
    try:
        # Roles were: Sales Engineer, quality manager (case mismatch?), technician, etc.
        # But looking at users_dump.json:
        # "Sales Engineer", "Quality Manager", "Testing Engineer", "Technician", "Admin", etc.
        
        # Deprecated roles to remove or map:
        # 1. Sales Engineer -> Sales Manager
        # 2. Testing Engineer -> Technician (if that's the mapping, or just Technician?)
        
        # Let's see what we have. 
        # The user wants "accurately working" sections.
        
        print("Cleaning up roles...")
        
        # Map Sales Engineer to Sales Manager
        se_users = db.query(User).filter(User.role == "Sales Engineer").all()
        for u in se_users:
            print(f"Mapping {u.email}: Sales Engineer -> Sales Manager")
            u.role = "Sales Manager"
        
        # Map technician (lowercase or different name) if exist
        te_users = db.query(User).filter(User.role == "Testing Engineer").all()
        for u in te_users:
             # If Técnico is the new role? No, ROLES in user_model.py says "Technical Manager", "Technical Lead" etc.
             # Wait, ROLES in user_model.py: 
             # "Admin", "Sales Manager", "Project Manager", "Finance Manager", "Quality Manager", "Team Lead", "Technical Manager"
             
             # Testing Engineer is not in ROLES. Let's map to Technical Manager or Team Lead?
             # Probably Technical Manager.
             print(f"Mapping {u.email}: Testing Engineer -> Technical Manager")
             u.role = "Technical Manager"

        # Technician -> Technical Manager
        tech_users = db.query(User).filter(User.role == "Technician").all()
        for u in tech_users:
             print(f"Mapping {u.email}: Technician -> Technical Manager")
             u.role = "Technical Manager"

        db.commit()
        print("Cleanup completed.")
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_roles()
