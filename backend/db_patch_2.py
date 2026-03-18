import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings

def run_patch():
    engine = create_engine(settings.DATABASE_URL)
    with engine.begin() as conn:
        try:
            conn.execute(text("UPDATE audits_section SET \"auditNumber\" = 'LEGACY-' || id WHERE \"auditNumber\" IS NULL;"))
            conn.execute(text("UPDATE audits_section SET \"auditType\" = 'Internal Audit' WHERE \"auditType\" IS NULL;"))
            print("Successfully updated NULLs.")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    run_patch()
