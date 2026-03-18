from sqlalchemy import create_engine, text

db_url = "postgresql://neondb_owner:npg_1SKzmofGHl0w@ep-flat-tooth-a11scmlm-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
engine = create_engine(db_url)

with engine.connect() as conn:
    row = conn.execute(text("SELECT full_name, role FROM users WHERE id = 'b4840736-7821-4fbc-a76f-ed34a56b5231'")).fetchone()
    if row:
        print(f"User: {row[0]}")
        print(f"Role: {row[1]}")
    else:
        print("User not found")
