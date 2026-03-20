import socket

def check_neon():
    host = "ep-flat-tooth-a11scmlm-pooler.ap-southeast-1.aws.neon.tech"
    print(f"Checking {host}...")
    try:
        ip = socket.gethostbyname(host)
        print(f"Successfully resolved to {ip}")
    except socket.gaierror as e:
        print(f"Resolution failed: {e}")

if __name__ == "__main__":
    check_neon()
