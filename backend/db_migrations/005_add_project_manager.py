"""
Standalone migration script to add manager_id and manager_name to the projects table.
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
    logger.info("Starting migration: Projects table manager fields...")
    
    queries = [
        "ALTER TABLE projects ADD COLUMN IF NOT EXISTS manager_id UUID;",
        "ALTER TABLE projects ADD COLUMN IF NOT EXISTS manager_name VARCHAR(255);",
        "CREATE INDEX IF NOT EXISTS ix_projects_manager_id ON projects (manager_id);",
        "ALTER TABLE projects ADD CONSTRAINT fk_projects_manager_id FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;"
    ]
    
    try:
        with engine.connect() as conn:
            for query in queries:
                logger.info(f"Executing: {query}")
                try:
                    conn.execute(text(query))
                    conn.commit()
                except Exception as inner_e:
                    # Ignore if constraint already exists or column exists
                    logger.warning(f"Query failed (might already exist): {inner_e}")
            logger.info("Successfully updated the projects table.")
    except Exception as e:
        logger.error(f"Migration failed at projects table: {e}")
        raise e

if __name__ == "__main__":
    migrate()
