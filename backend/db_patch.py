import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings

def run_patch():
    engine = create_engine(settings.DATABASE_URL)
    with engine.begin() as conn:
        try:
            conn.execute(text('ALTER TABLE audits_section ADD COLUMN "auditNumber" VARCHAR;'))
            conn.execute(text('ALTER TABLE audits_section ADD COLUMN "auditType" VARCHAR;'))
            print("Successfully added auditNumber and auditType to audits_section table.")
        except Exception as e:
            print(f"Error (columns might already exist): {e}")

if __name__ == "__main__":
    run_patch()
