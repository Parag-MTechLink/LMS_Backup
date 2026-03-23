import logging
from sqlalchemy import text
from app.core.database import engine

logger = logging.getLogger("app.migrations.004_crm_integration")

def migrate():
    """
    Consolidated CRM Migration:
    1. Enhance crm_customers table.
    2. Create crm_field_mappings table.
    3. Create crm_connections table.
    4. Add crm_customer_id to customers table.
    """
    with engine.begin() as conn:
        
        def _col_exists(table, col):
            r = conn.execute(text(
                "SELECT column_name FROM information_schema.columns "
                f"WHERE table_name='{table}' AND column_name='{col}'"
            )).fetchone()
            return r is not None

        def _table_exists(table):
            r = conn.execute(text(
                f"SELECT tablename FROM pg_tables WHERE tablename='{table}'"
            )).fetchone()
            return r is not None

        # ── 1. Enhance crm_customers ───────────────────────────────────────────
        if not _col_exists("crm_customers", "source_system"):
            conn.execute(text("ALTER TABLE crm_customers ADD COLUMN source_system VARCHAR(100) NOT NULL DEFAULT 'manual'"))
            logger.info("Added crm_customers.source_system")

        if not _col_exists("crm_customers", "raw_data"):
            conn.execute(text("ALTER TABLE crm_customers ADD COLUMN raw_data JSONB"))
            # Back-fill if old discrete columns exist
            if _col_exists("crm_customers", "company_name"):
                conn.execute(text("""
                    UPDATE crm_customers SET raw_data = json_build_object(
                        'company_name', company_name,
                        'email',        email,
                        'phone',        phone,
                        'contact_person', contact_person,
                        'region',       region,
                        'source',       source
                    )::jsonb WHERE raw_data IS NULL
                """))
                logger.info("Back-filled raw_data from legacy columns")
            
            conn.execute(text("UPDATE crm_customers SET raw_data = '{}'::jsonb WHERE raw_data IS NULL"))
            conn.execute(text("ALTER TABLE crm_customers ALTER COLUMN raw_data SET NOT NULL"))
            logger.info("Finalized crm_customers.raw_data")

        if not _col_exists("crm_customers", "migration_status"):
            conn.execute(text("ALTER TABLE crm_customers ADD COLUMN migration_status VARCHAR(50) NOT NULL DEFAULT 'pending'"))
            logger.info("Added crm_customers.migration_status")

        if not _col_exists("crm_customers", "mapped_customer_id"):
            conn.execute(text("ALTER TABLE crm_customers ADD COLUMN mapped_customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL"))
            logger.info("Added crm_customers.mapped_customer_id")

        # ── 2. crm_field_mappings Table ────────────────────────────────────────
        if not _table_exists("crm_field_mappings"):
            conn.execute(text("""
                CREATE TABLE crm_field_mappings (
                    id              SERIAL PRIMARY KEY,
                    source_system   VARCHAR(100) NOT NULL,
                    crm_field       VARCHAR(255) NOT NULL,
                    lms_field       VARCHAR(255) NOT NULL,
                    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
                    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
                    UNIQUE (source_system, crm_field)
                )
            """))
            logger.info("Created crm_field_mappings table")

        # ── 3. crm_connections Table ───────────────────────────────────────────
        if not _table_exists("crm_connections"):
            conn.execute(text("""
                CREATE TABLE crm_connections (
                    id              SERIAL PRIMARY KEY,
                    provider        VARCHAR(50) NOT NULL UNIQUE,
                    access_token    VARCHAR(2048),
                    refresh_token   VARCHAR(2048),
                    client_id       VARCHAR(1024),
                    client_secret   VARCHAR(1024),
                    instance_url    VARCHAR(255),
                    expires_at      TIMESTAMP,
                    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
                    last_sync_at    TIMESTAMP,
                    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
                    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
                )
            """))
            logger.info("Created crm_connections table")
        else:
            # Add client columns if missing (case where 006 run but 007 didn't)
            if not _col_exists("crm_connections", "client_id"):
                conn.execute(text("ALTER TABLE crm_connections ADD COLUMN client_id VARCHAR(1024)"))
            if not _col_exists("crm_connections", "client_secret"):
                conn.execute(text("ALTER TABLE crm_connections ADD COLUMN client_secret VARCHAR(1024)"))
            # Ensure access_token is nullable
            conn.execute(text("ALTER TABLE crm_connections ALTER COLUMN access_token DROP NOT NULL"))

        # ── 4. customers Table Column ──────────────────────────────────────────
        if not _col_exists("customers", "crm_customer_id"):
            conn.execute(text("ALTER TABLE customers ADD COLUMN crm_customer_id INTEGER REFERENCES crm_customers(id) ON DELETE SET NULL;"))
            logger.info("Added customers.crm_customer_id")
