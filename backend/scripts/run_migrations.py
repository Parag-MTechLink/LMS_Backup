import os
import sys
import importlib.util

# Add backend directory to path so we can import 'app'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

def run_all_migrations():
    """
    Automatically finds and runs all .py migration scripts in the db_migrations folder.
    """
    migrations_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "db_migrations"))
    
    if not os.path.exists(migrations_dir):
        print(f"Error: Migrations directory not found at {migrations_dir}")
        return

    # Get all .py files except __init__.py
    files = [f for f in os.listdir(migrations_dir) if f.endswith(".py") and f != "__init__.py"]
    files.sort()  # Runs in alphabetical/numeric order

    if not files:
        print("No migration scripts found.")
        return

    print(f"Found {len(files)} migration script(s).")

    for file in files:
        file_path = os.path.join(migrations_dir, file)
        print(f"\n[RUNNING] {file}...")
        
        # Load the module dynamically
        module_name = file[:-3]
        spec = importlib.util.spec_from_file_location(module_name, file_path)
        module = importlib.util.module_from_spec(spec)
        
        try:
            spec.loader.exec_module(module)
            # Each script should have a migrate() function
            if hasattr(module, "migrate"):
                module.migrate()
                print(f"[SUCCESS] {file} completed.")
            else:
                print(f"[SKIP] No 'migrate()' function found in {file}.")
        except Exception as e:
            print(f"[FAILED] {file}: {e}")
            break # Stop execution on failure to prevent DB corruption/inconsistency

if __name__ == "__main__":
    run_all_migrations()
