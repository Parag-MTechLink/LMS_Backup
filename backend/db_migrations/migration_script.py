"""
Standalone migration script to add password reset columns to the users table.
Usage: python migration_script.py
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
    logger.info("Starting migration: Users table reset columns...")
    
    queries = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP WITHOUT TIME ZONE;",
        "CREATE INDEX IF NOT EXISTS ix_users_reset_token ON users (reset_token);"
    ]
    
    try:
        with engine.connect() as conn:
            for query in queries:
                conn.execute(text(query))
                conn.commit()
            logger.info("Successfully updated the users table.")
    except Exception as e:
        logger.error(f"Migration failed at users table: {e}")
        raise e

if __name__ == "__main__":
    migrate()
