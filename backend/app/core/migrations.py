import os
import logging
import importlib.util
from sqlalchemy import text
from app.core.database import engine

logger = logging.getLogger("app.migrations")

def run_all_migrations():
    """
    Automatically finds and runs all .py migration scripts in the db_migrations folder.
    Designed to be called on system startup or via standalone script.
    """
    # Path relative to this file (app/core/migrations.py -> backend/db_migrations)
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    migrations_dir = os.path.join(backend_dir, "db_migrations")
    
    if not os.path.exists(migrations_dir):
        logger.warning(f"Migrations directory not found at {migrations_dir}")
        return

    # Get all .py files except __init__.py
    files = [f for f in os.listdir(migrations_dir) if f.endswith(".py") and f != "__init__.py"]
    files.sort()  # Runs in alphabetical/numeric order

    if not files:
        logger.info("No migration scripts found in db_migrations.")
        return

    logger.info(f"Checking {len(files)} database migration script(s)...")

    for file in files:
        file_path = os.path.join(migrations_dir, file)
        
        # Load the module dynamically
        module_name = file[:-3]
        spec = importlib.util.spec_from_file_location(module_name, file_path)
        module = importlib.util.module_from_spec(spec)
        
        try:
            spec.loader.exec_module(module)
            # Each script should have a migrate() function
            if hasattr(module, "migrate"):
                module.migrate()
                logger.info(f"Migration completed: {file}")
            else:
                logger.debug(f"Skipping {file}: No 'migrate()' function found.")
        except Exception as e:
            logger.error(f"Migration FAILED: {file} | Error: {e}")
            # In a real app, we might want to raise an exception here to stop startup
            # but for now we'll just log it to allow the server to potentially run.
            raise e 

if __name__ == "__main__":
    # Small test if run directly
    logging.basicConfig(level=logging.INFO)
    run_all_migrations()
