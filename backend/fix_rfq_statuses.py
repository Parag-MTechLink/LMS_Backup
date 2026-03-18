from sqlalchemy import text
from app.core.database import engine, get_connect_args
from app.core.config import settings

def fix_rfq_statuses():
    # Use the bypass for connecting
    connect_args = get_connect_args(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        print("Fixing RFQ statuses...")
        # Update any 'feasibility_done' to 'quotation_pending' so Finance Manager can see them
        try:
            result = conn.execute(text("UPDATE rfqs SET status = 'quotation_pending' WHERE status = 'feasibility_done'"))
            print(f"Updated {result.rowcount} RFQs from feasibility_done to quotation_pending.")
        except Exception as e:
            print(f"Error updating RFQ statuses: {e}")

        conn.commit()
    print("Fix completed.")

if __name__ == "__main__":
    fix_rfq_statuses()
