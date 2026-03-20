from app.core.database import SessionLocal
from app.modules.projects.models import Customer
import json

db = SessionLocal()
try:
    customers = db.query(Customer).filter(Customer.is_deleted == False).all()
    print(f"Found {len(customers)} customers:")
    for c in customers:
        print(f"ID: {c.id} | Name: {c.company_name}")
finally:
    db.close()
