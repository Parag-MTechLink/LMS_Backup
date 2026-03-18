from sqlalchemy import text
from app.core.database import engine, get_connect_args
from app.core.config import settings

def fix_schema():
    # Use the bypass for connecting
    connect_args = get_connect_args(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        print("Checking/Fixing 'rfqs' table...")
        columns_rfq = [
            ("technical_manager_id", "UUID REFERENCES users(id)"),
            ("finance_manager_id", "UUID REFERENCES users(id)"),
            ("feasibility_notes", "TEXT"),
            ("quotation_notes", "TEXT"),
            ("is_deleted", "BOOLEAN DEFAULT FALSE"),
            ("created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
            ("updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
        ]
        for col, type_ in columns_rfq:
            try:
                conn.execute(text(f"ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS {col} {type_}"))
                print(f"Verified/Added rfqs.{col}")
            except Exception as e:
                print(f"Error verified/added rfqs.{col}: {e}")

        print("\nChecking/Fixing 'projects' table...")
        columns_project = [
            ("quality_manager_approved", "BOOLEAN DEFAULT FALSE"),
            ("project_manager_approved", "BOOLEAN DEFAULT FALSE"),
            ("technical_manager_approved", "BOOLEAN DEFAULT FALSE"),
            ("payment_completed", "BOOLEAN DEFAULT FALSE"),
            ("team_lead_id", "UUID REFERENCES users(id)"),
            ("oem", "VARCHAR(255)"),
            ("description", "TEXT"),
            ("is_deleted", "BOOLEAN DEFAULT FALSE"),
            ("created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
            ("updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
        ]
        for col, type_ in columns_project:
            try:
                conn.execute(text(f"ALTER TABLE projects ADD COLUMN IF NOT EXISTS {col} {type_}"))
                print(f"Verified/Added projects.{col}")
            except Exception as e:
                print(f"Error verified/added projects.{col}: {e}")

        conn.commit()
    print("\nFix completed.")

if __name__ == "__main__":
    fix_schema()
