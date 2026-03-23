import sys
import os

# Add the backend directory to sys.path so we can import from app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import text
from app.core.database import engine
import logging

logger = logging.getLogger("app.migrations")

def migrate():
    logger.info("Starting migration: Calibrations table certificate_url...")
    
    queries = [
        "ALTER TABLE calibrations ADD COLUMN IF NOT EXISTS certificate_url VARCHAR(500);"
    ]
    
    try:
        with engine.begin() as conn:
            for query in queries:
                conn.execute(text(query))
            logger.info("Successfully updated the calibrations table.")
    except Exception as e:
        logger.error(f"Migration failed at calibrations table: {e}")
        # Even if it fails (e.g. SQLite doesn't support IF NOT EXISTS for ADD COLUMN), 
        # we log it but don't necessarily want to block progress if the column exists.
        # But for Postgres it's standard.
        raise e

if __name__ == "__main__":
    migrate()
