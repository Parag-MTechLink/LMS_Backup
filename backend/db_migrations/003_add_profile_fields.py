"""
Migration script to add profile fields to the users table.
"""
import sys
import os

# Add the backend directory to sys.path so we can import from app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import text
from app.core.database import engine
import logging

logger = logging.getLogger("app.migrations")

def migrate():
    logger.info("Starting migration: Users table profile fields...")
    
    queries = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS language TEXT;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name TEXT;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_no TEXT;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS designation TEXT;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS industry TEXT;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type TEXT;"
    ]
    
    try:
        with engine.connect() as conn:
            for query in queries:
                conn.execute(text(query))
                conn.commit()
            logger.info("Successfully updated the users table with profile fields.")
    except Exception as e:
        logger.error(f"Migration failed at users table: {e}")
        raise e

if __name__ == "__main__":
    migrate()
