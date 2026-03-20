import os
from sqlalchemy import create_engine, text

db_url = "postgresql://neondb_owner:npg_1SKzmofGHl0w@ep-flat-tooth-a11scmlm-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
engine = create_engine(db_url)

with engine.connect() as conn:
    row = conn.execute(text("SELECT status, team_lead_id FROM projects WHERE id = 29")).fetchone()
    if row:
        print(f"Status: {row[0]}")
        print(f"TeamLeadID: {row[1]}")
    else:
        print("Project 29 not found")
