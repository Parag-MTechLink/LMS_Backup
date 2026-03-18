import jwt
from datetime import datetime, timedelta, timezone
import urllib.request
import urllib.parse
import json

SECRET = "1kXIzB5ySIJxBE3HcceSLIgLgkPzcY3WaT0PNv8bsmw"
ALGO = "HS256"
BASE_URL = "http://127.0.0.1:8001/api/v1"

def create_token(user_id, email, role):
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=60)
    payload = {
        "sub": str(user_id),
        "role": role,
        "email": email,
        "iat": now,
        "exp": expire,
        "type": "access",
    }
    return jwt.encode(payload, SECRET, algorithm=ALGO)

def make_request(url, method="GET", data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    encoded_data = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.getcode(), json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode())
        except:
            return e.code, e.read().decode()
    except Exception as e:
        return 0, str(e)

def run_repro():
    # Technical Manager role for feasibility
    # Pranav (Technical Manager) | d9147f25-ce57-414c-859a-1cc170150942
    token = create_token("d9147f25-ce57-414c-859a-1cc170150942", "pranav@mtltechnlink.com", "Technical Manager")
    print(f"Generated Token for Technical Manager: {token[:20]}...")

    print("\nTesting GET /estimations/test-types...")
    code, res = make_request(f"{BASE_URL}/estimations/test-types", token=token)
    print(f"Code: {code}")
    print(f"Result: {res}")

    print("\nTesting POST /rfqs/1/feasibility...")
    data = {"notes": "Test feasibility notes from repro script"}
    code, res = make_request(f"{BASE_URL}/rfqs/1/feasibility", method="POST", data=data, token=token)
    print(f"Code: {code}")
    print(f"Result: {res}")

if __name__ == "__main__":
    run_repro()
