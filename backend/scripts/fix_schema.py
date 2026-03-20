import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

def fix():
    url = os.getenv("DATABASE_URL")
    if not url:
        print("DATABASE_URL not found")
        return
    
    engine = create_engine(url)
    with engine.connect() as conn:
        try:
            # PostgreSQL syntax: ADD COLUMN IF NOT EXISTS is only available in 9.6+, 
            # but usually fails gracefully if we wrap it.
            conn.execute(text("ALTER TABLE users ADD COLUMN is_main BOOLEAN DEFAULT FALSE NOT NULL"))
            conn.commit()
            print("Successfully added is_main column to users table.")
        except Exception as e:
            if "already exists" in str(e).lower():
                print("Column is_main already exists.")
            else:
                print(f"Error adding column: {e}")

if __name__ == "__main__":
    fix()
