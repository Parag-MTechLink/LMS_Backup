from app.core.database import SessionLocal
from app.models.user_model import User
import json

db = SessionLocal()
try:
    users = db.query(User).all()
    dump = []
    for u in users:
        dump.append({
            "id": str(u.id),
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active
        })
    with open("users_dump.json", "w") as f:
        json.dump(dump, f, indent=4)
    print(f"Dumped {len(dump)} users.")
finally:
    db.close()
