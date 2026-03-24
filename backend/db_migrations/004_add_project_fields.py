"""
Standalone migration script to add professional fields to the projects table.
"""
import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import text
from app.core.database import engine

import logging

# Ensure logging is configured for standalone run
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app.migrations")

def migrate():
    logger.info("Starting migration: Projects table professional fields...")
    
    queries = [
        "ALTER TABLE projects ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'Medium';",
        "ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITHOUT TIME ZONE;",
        "ALTER TABLE projects ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITHOUT TIME ZONE;",
        "ALTER TABLE projects ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;"
    ]
    
    try:
        with engine.connect() as conn:
            for query in queries:
                logger.info(f"Executing: {query}")
                conn.execute(text(query))
                conn.commit()
            logger.info("Successfully updated the projects table.")
    except Exception as e:
        logger.error(f"Migration failed at projects table: {e}")
        raise e

if __name__ == "__main__":
    migrate()
