import os
import logging
import importlib.util
from datetime import datetime
from sqlalchemy import text
from app.core.database import engine

logger = logging.getLogger("app.migrations")

def ensure_migrations_table():
    """Ensure that the _migrations tracking table exists."""
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS _migrations (
        version_name VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
    try:
        with engine.begin() as conn:
            conn.execute(text(create_table_sql))
        logger.debug("Checked/Created _migrations tracking table.")
    except Exception as e:
        logger.error(f"Failed to create tracking table: {e}")
        raise e

def is_migration_applied(version_name: str) -> bool:
    """Check if a migration has already been applied."""
    check_sql = text("SELECT 1 FROM _migrations WHERE version_name = :v")
    try:
        with engine.connect() as conn:
            result = conn.execute(check_sql, {"v": version_name}).fetchone()
            return result is not None
    except Exception as e:
        logger.error(f"Error checking migration status for {version_name}: {e}")
        return False

def record_migration(version_name: str):
    """Record a successful migration in the tracking table."""
    insert_sql = text("INSERT INTO _migrations (version_name) VALUES (:v)")
    try:
        with engine.begin() as conn:
            conn.execute(insert_sql, {"v": version_name})
    except Exception as e:
        logger.error(f"Failed to record migration {version_name}: {e}")
        raise e

def run_all_migrations():
    """
    Automatically finds and runs all .py migration scripts in the db_migrations folder.
    Tracks progress in the _migrations table to ensure each script runs only once.
    """
    # 1. Ensure tracking table exists
    ensure_migrations_table()
    
    # 2. Setup paths
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    migrations_dir = os.path.join(backend_dir, "db_migrations")
    
    if not os.path.exists(migrations_dir):
        logger.warning(f"Migrations directory not found at {migrations_dir}")
        return

    # 3. Get scripts
    files = [f for f in os.listdir(migrations_dir) if f.endswith(".py") and f != "__init__.py"]
    files.sort()

    if not files:
        logger.info("No migration scripts found in db_migrations.")
        return

    logger.info(f"Checking {len(files)} database migration script(s)...")

    for file in files:
        version_name = file
        
        # 4. Idempotency Check
        if is_migration_applied(version_name):
            logger.info(f"Skipping {file}: Already applied.")
            continue

        file_path = os.path.join(migrations_dir, file)
        module_name = file[:-3]
        spec = importlib.util.spec_from_file_location(module_name, file_path)
        module = importlib.util.module_from_spec(spec)
        
        try:
            spec.loader.exec_module(module)
            if hasattr(module, "migrate"):
                logger.info(f"Running migration: {file}...")
                
                # Each script manages its own transaction for now
                module.migrate()
                
                # 5. Record Success
                record_migration(version_name)
                logger.info(f"Migration COMPLETED: {file}")
            else:
                logger.debug(f"Skipping {file}: No 'migrate()' function found.")
        except Exception as e:
            logger.error(f"Migration FAILED: {file} | Error: {e}")
            # Stop execution on failure to maintain sequence
            raise e 

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_all_migrations()
