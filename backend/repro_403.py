import urllib.request
import urllib.parse
import json

BASE_URL = "http://127.0.0.1:8001/api/v1"

def test_sales_manager_access():
    login_data = {
        "email": "vivaan@gmail.com",
        "password": "Password@123"
    }
    
    print(f"Attempting login for {login_data['email']}...")
    try:
        data = json.dumps(login_data).encode("utf-8")
        req = urllib.request.Request(f"{BASE_URL}/auth/login", data=data, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req) as response:
            res_body = json.loads(response.read().decode())
            token = res_body["access_token"]
            print("Login successful.")
            
            headers = {"Authorization": f"Bearer {token}"}
            print("Fetching /rfqs...")
            req_rfqs = urllib.request.Request(f"{BASE_URL}/rfqs", headers=headers)
            with urllib.request.urlopen(req_rfqs) as resp_rfqs:
                print(f"Status: {resp_rfqs.getcode()}")
                print(f"Response: {resp_rfqs.read().decode()[:200]}...")
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code}")
        print(f"Reason: {e.read().decode()}")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    test_sales_manager_access()
