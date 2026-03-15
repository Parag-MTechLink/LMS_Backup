"""
Migration script to add Multi-Factor Authentication (MFA) columns to the users table.
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
    logger.info("Starting migration: Users table MFA columns...")
    
    queries = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_code TEXT;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_code_expires TIMESTAMP WITHOUT TIME ZONE;",
        "CREATE INDEX IF NOT EXISTS ix_users_mfa_code ON users (mfa_code);"
    ]
    
    try:
        with engine.connect() as conn:
            for query in queries:
                conn.execute(text(query))
                conn.commit()
            logger.info("Successfully updated the users table with MFA columns.")
    except Exception as e:
        logger.error(f"Migration failed at users table: {e}")
        raise e

if __name__ == "__main__":
    migrate()
