from app.core.database import SessionLocal
from sqlalchemy import text
import json

def final_cleanup():
    db = SessionLocal()
    try:
        # Standardize all statuses to underscores as per model
        db.execute(text("UPDATE projects SET status = 'pending_team_lead' WHERE LOWER(status) IN ('pending', 'pending team lead')"))
        db.execute(text("UPDATE projects SET status = 'testing_in_progress' WHERE LOWER(status) = 'active'"))
        db.commit()
        
        # Verify
        res = db.execute(text("SELECT id, status FROM projects")).fetchall()
        print(json.dumps([{'id': r[0], 'status': r[1]} for r in res]))
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    final_cleanup()
