"""
Standalone migration script to add parent_id column to the users table.
Usage: python add_parent_id_column.py
"""
import sys
import os

# Add the current directory to sys.path so we can import from app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import text
from app.core.database import engine

def migrate():
    print("Starting migration to add parent_id...")
    
    queries = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_id UUID;",
        "CREATE INDEX IF NOT EXISTS ix_users_parent_id ON users (parent_id);"
    ]
    
    try:
        with engine.connect() as conn:
            for query in queries:
                print(f"Executing: {query}")
                conn.execute(text(query))
                conn.commit()
            print("Successfully updated the users table with parent_id.")
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
