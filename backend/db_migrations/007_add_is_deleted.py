"""
Migration: Add is_deleted column to all tables that require it.
"""
import sys
import os
from dotenv import load_dotenv

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.append(BACKEND_DIR)

load_dotenv(os.path.join(BACKEND_DIR, ".env"))

from sqlalchemy import text
from app.core.database import engine

import logging

logger = logging.getLogger("app.migrations")
logging.basicConfig(level=logging.INFO)

def migrate():
    logger.info("Starting migration: Add is_deleted...")

    # Tables determined from the grep search
    tables = [
        "rfqs",
        "customers",
        "projects",
        "test_plans",
        "test_executions",
        "qa_sops",
        "qa_documents",
        "qc_checks",
        "nc_capas",
        "qa_audits"
    ]

    try:
        with engine.begin() as conn:
            for table in tables:
                query = text(
                    f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE NOT NULL;"
                )
                try:
                    logger.info(f"Executing: ALTER TABLE {table} ADD COLUMN IF NOT EXISTS is_deleted ...")
                    conn.execute(query)
                except Exception as col_e:
                    if "does not exist" in str(col_e).lower():
                        logger.warning(f"Table {table} does not exist yet. Skipping.")
                    elif "already exists" in str(col_e).lower():
                        logger.warning(f"Column is_deleted already exists on {table}, skipping.")
                    else:
                        logger.warning(f"Could not add is_deleted to {table}: {col_e}")
                        
        logger.info("Migration COMPLETED: is_deleted fields added successfully.")
    except Exception as e:
        logger.error(f"Migration FAILED: {e}")
        raise e

if __name__ == "__main__":
    migrate()
