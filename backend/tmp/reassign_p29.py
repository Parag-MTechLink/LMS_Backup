from sqlalchemy import create_engine, text

db_url = 'postgresql://neondb_owner:npg_1SKzmofGHl0w@ep-flat-tooth-a11scmlm-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
engine = create_engine(db_url)

target_id = '07576de5-03f2-4cbd-a457-deb5978c25bd'
project_id = 29

with engine.connect() as conn:
    conn.execute(text("UPDATE projects SET team_lead_id = :tid WHERE id = :pid"), {"tid": target_id, "pid": project_id})
    conn.commit()
    print(f"Reassigned Project {project_id} to {target_id}")
