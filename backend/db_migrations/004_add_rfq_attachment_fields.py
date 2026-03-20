"""
Migration to add attachment and description columns to the rfqs table.
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
    logger.info("Starting migration: RFQ table enhancements...")
    
    queries = [
        "ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS feasibility_attachment_url TEXT;",
        "ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS quotation_attachment_url TEXT;",
        "ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS description TEXT;"
    ]
    
    try:
        with engine.begin() as conn:
            for query in queries:
                logger.info(f"Executing: {query}")
                conn.execute(text(query))
            logger.info("Successfully updated the rfqs table.")
    except Exception as e:
        logger.error(f"Migration failed at rfqs table: {e}")
        raise e

if __name__ == "__main__":
    migrate()
