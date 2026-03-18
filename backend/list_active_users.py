from app.core.database import SessionLocal
from app.models.user_model import User
import json

db = SessionLocal()
try:
    # Just list some active users to try
    users = db.query(User).filter(User.is_active == True).limit(10).all()
    print("Active Users:")
    for u in users:
        print(f"{u.email} | {u.role}")
finally:
    db.close()
