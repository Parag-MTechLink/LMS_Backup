from app.core.database import SessionLocal
from app.modules.projects.models import Project
from app.models.user_model import User
from sqlalchemy import text

def finalize_system():
    db = SessionLocal()
    try:
        print("Standardizing Project statuses...")
        # Map old statuses to new ones
        db.execute(text("UPDATE projects SET status = 'pending_team_lead' WHERE status = 'pending'"))
        db.execute(text("UPDATE projects SET status = 'completed' WHERE status = 'active'")) # or maybe testing_in_progress? 
        # Actually, let's keep 'active' as 'testing_in_progress' for now if it makes sense, 
        # but the model says 'testing_in_progress'. 
        db.execute(text("UPDATE projects SET status = 'testing_in_progress' WHERE status = 'active'"))
        
        print("Ensuring Team Lead roles...")
        # If no Team Lead exists, let's make the mapped 'Technical Managers' from 'Testing Engineers' into 'Team Leads'
        # Looking at my previous cleanup: tanishkap and pranav@mtltechnlink were mapped to Technical Manager.
        # Let's map any 'Technical Manager' who was originally a 'Technician' or 'Testing Engineer' to 'Team Lead' if it fits better.
        # Better yet, let's just make sure there ARE some Team Leads.
        
        # Pranav (testing engineer) should be Team Lead per workflow
        u = db.query(User).filter(User.email == "pranav@mtltechnlink.com").first()
        if u:
            print(f"Assigning Team Lead role to {u.email}")
            u.role = "Team Lead"
            
        u2 = db.query(User).filter(User.email == "tanishkap@gmail.com").first()
        if u2:
            print(f"Assigning Team Lead role to {u2.email}")
            u2.role = "Team Lead"

        db.commit()
        print("System finalized.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    finalize_system()
