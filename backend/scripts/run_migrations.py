import os
import sys

# Add backend directory to path so we can import 'app'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.migrations import run_all_migrations

if __name__ == "__main__":
    print("Manual Migration Runner Starting...")
    try:
        run_all_migrations()
        print("\nAll migrations checked/completed successfully.")
    except Exception as e:
        print(f"\nFATAL ERROR during migrations: {e}")
        sys.exit(1)
