"""
Standalone migration script to add password reset columns to the users table.
Usage: python migration_script.py
"""
import sys
import os

# Add the current directory to sys.path so we can import from app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from sqlalchemy import text
from app.core.database import engine

def migrate():
    print("Starting migration...")
    
    queries = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP WITHOUT TIME ZONE;",
        "CREATE INDEX IF NOT EXISTS ix_users_reset_token ON users (reset_token);"
    ]
    
    try:
        with engine.connect() as conn:
            for query in queries:
                print(f"Executing: {query}")
                conn.execute(text(query))
                conn.commit()
            print("Successfully updated the users table.")
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
