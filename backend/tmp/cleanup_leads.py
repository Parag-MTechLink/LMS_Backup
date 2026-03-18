from sqlalchemy import create_engine, text
import os

db_url = 'postgresql://neondb_owner:npg_1SKzmofGHl0w@ep-flat-tooth-a11scmlm-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
engine = create_engine(db_url)

target_email = 'tanishka.pitale@millenniumtechlink.com'

with engine.connect() as conn:
    # 1. Find the target user ID
    res = conn.execute(text("SELECT id FROM users WHERE email = :email"), {"email": target_email}).fetchone()
    if not res:
        print(f"Error: User {target_email} not found!")
        exit(1)
    
    target_id = res[0]
    print(f"Target User ID: {target_id}")

    # 2. Get all other Team Leads
    leads = conn.execute(text("SELECT id, email FROM users WHERE role = 'Team Lead' AND email != :email"), {"email": target_email}).fetchall()
    
    for lead_id, email in leads:
        print(f"Deleting Team Lead: {email} ({lead_id})")
        # Check if they are assigned to any projects and unassign or reassign
        conn.execute(text("UPDATE projects SET team_lead_id = NULL WHERE team_lead_id = :old_id"), {"old_id": lead_id})
        conn.execute(text("DELETE FROM users WHERE id = :old_id"), {"old_id": lead_id})
    
    conn.commit()
    print("Done.")
