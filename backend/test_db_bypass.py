import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()
# Resolved IP for ep-flat-tooth-a11scmlm-pooler.ap-southeast-1.aws.neon.tech
IP = "52.220.170.93" 
ORIGINAL_HOST = "ep-flat-tooth-a11scmlm-pooler.ap-southeast-1.aws.neon.tech"

url = os.getenv("DATABASE_URL")
# Replace host with IP
new_url = url.replace(ORIGINAL_HOST, IP)

print(f"Testing connection to IP: {IP}...")
try:
    # We might need to pass the original host for SNI/SSL verification
    conn = psycopg2.connect(new_url, connect_timeout=10)
    print("Connection successful with IP!")
    conn.close()
except Exception as e:
    print(f"Connection failed with IP: {e}")

print("\nTesting with hostaddr parameter...")
try:
    # psycopg2 allows host and hostaddr
    # We'll parse the URL or just use params
    params = {
        "host": ORIGINAL_HOST,
        "hostaddr": IP,
        "user": "neondb_owner",
        "password": "npg_1SKzmofGHl0w",
        "dbname": "neondb",
        "sslmode": "require"
    }
    conn = psycopg2.connect(**params)
    print("Connection successful with hostaddr!")
    conn.close()
except Exception as e:
    print(f"Connection failed with hostaddr: {e}")
