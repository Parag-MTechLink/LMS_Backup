"""
Migration to add traceability columns to the rfqs table.
"""
import sys
import os
from dotenv import load_dotenv

# Add the backend directory to sys.path so we can import from app
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.append(BACKEND_DIR)

# Explicitly load .env from backend root
load_dotenv(os.path.join(BACKEND_DIR, ".env"))

from sqlalchemy import text
from app.core.database import engine

import logging

logger = logging.getLogger("app.migrations")
logging.basicConfig(level=logging.INFO)

def migrate():
    logger.info("Starting migration: RFQ traceability fields...")
    
    columns = [
        ("feasibility_done_by_name", "VARCHAR(255)"),
        ("feasibility_done_by_role", "VARCHAR(255)"),
        ("feasibility_done_at", "TIMESTAMP"),
        ("quotation_done_by_name", "VARCHAR(255)"),
        ("quotation_done_by_role", "VARCHAR(255)"),
        ("quotation_done_at", "TIMESTAMP")
    ]
    
    try:
        with engine.begin() as conn:
            for col_name, col_type in columns:
                # PostgreSQL ALTER TABLE ADD COLUMN
                query = text(f"ALTER TABLE rfqs ADD COLUMN {col_name} {col_type};")
                try:
                    logger.info(f"Executing: {query}")
                    conn.execute(query)
                except Exception as col_e:
                    if "already exists" in str(col_e).lower():
                        logger.warning(f"Column {col_name} already exists, skipping.")
                    else:
                        raise col_e
            logger.info("Successfully added traceability columns to the rfqs table.")
    except Exception as e:
        logger.error(f"Migration failed at rfqs table: {e}")
        raise e

if __name__ == "__main__":
    migrate()
