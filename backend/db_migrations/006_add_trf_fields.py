"""
Migration: Add enriched fields to the trfs table.
Adds status, test_type, description, sample_description, priority,
approved_by, created_at, updated_at columns.
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
    logger.info("Starting migration: TRF enrichment fields...")

    columns = [
        ("status",             "VARCHAR(50)  DEFAULT 'Draft'"),
        ("test_type",          "VARCHAR(255)"),
        ("description",        "TEXT"),
        ("sample_description", "TEXT"),
        ("priority",           "VARCHAR(50)  DEFAULT 'Normal'"),
        ("approved_by",        "VARCHAR(255)"),
        ("created_at",         "TIMESTAMP    DEFAULT CURRENT_TIMESTAMP"),
        ("updated_at",         "TIMESTAMP    DEFAULT CURRENT_TIMESTAMP"),
    ]

    try:
        with engine.begin() as conn:
            for col_name, col_def in columns:
                query = text(
                    f"ALTER TABLE trfs ADD COLUMN IF NOT EXISTS {col_name} {col_def};"
                )
                try:
                    logger.info(f"Executing: ALTER TABLE trfs ADD COLUMN IF NOT EXISTS {col_name} ...")
                    conn.execute(query)
                except Exception as col_e:
                    if "already exists" in str(col_e).lower():
                        logger.warning(f"Column {col_name} already exists, skipping.")
                    else:
                        raise col_e
        logger.info("Migration COMPLETED: TRF enrichment fields added successfully.")
    except Exception as e:
        logger.error(f"Migration FAILED: {e}")
        raise e


if __name__ == "__main__":
    migrate()
