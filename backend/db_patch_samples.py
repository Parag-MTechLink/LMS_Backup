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
            conn.execute(text('ALTER TABLE samples ADD COLUMN quantity INTEGER;'))
            print("Successfully added quantity to samples table.")
        except Exception as e:
            print(f"Error adding quantity: {e}")
        try:
            conn.execute(text('ALTER TABLE samples ADD COLUMN "testDetails" VARCHAR;'))
            print("Successfully added testDetails to samples table.")
        except Exception as e:
            print(f"Error adding testDetails: {e}")

if __name__ == "__main__":
    run_patch()
