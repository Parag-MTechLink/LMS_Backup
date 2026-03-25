import logging
from sqlalchemy import text
from app.core.database import engine

logger = logging.getLogger("app.migrations")

def migrate():
    """
    Ensure audit columns use snake_case in DB for robustness.
    Rename if exists (quoted or unquoted), or add if missing.
    """
    with engine.begin() as conn:
        # Check current columns
        cols_query = text("SELECT column_name FROM information_schema.columns WHERE table_name = 'audits_section'")
        existing_cols = [row[0] for row in conn.execute(cols_query).fetchall()]
        
        logger.info(f"Existing columns in audits_section: {existing_cols}")
        
        # Mapping from possible variations to snake_case
        renames = {
            "auditNumber": "audit_number",
            "auditType": "audit_type",
            "auditDate": "audit_date",
            "auditorName": "auditor_name",
            "auditnumber": "audit_number",
            "audittype": "audit_type",
            "auditdate": "audit_date",
            "auditorname": "auditor_name"
        }
        
        for old_col, new_col in renames.items():
            if old_col in existing_cols and new_col not in existing_cols:
                logger.info(f"Renaming column {old_col} to {new_col}...")
                conn.execute(text(f'ALTER TABLE audits_section RENAME COLUMN "{old_col}" TO {new_col}'))
            elif new_col not in existing_cols:
                # Add if not exists
                col_type = "VARCHAR"
                if "date" in new_col:
                    col_type = "DATE"
                logger.info(f"Adding missing column {new_col}...")
                conn.execute(text(f"ALTER TABLE audits_section ADD COLUMN IF NOT EXISTS {new_col} {col_type}"))

if __name__ == "__main__":
    migrate()
