import secrets
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional

logger = logging.getLogger("app")

class OTPService:
    """
    In-memory OTP storage and management for development and verification.
    """
    def __init__(self, expiry_minutes: int = 5, max_attempts: int = 3):
        self.expiry_minutes = expiry_minutes
        self.max_attempts = max_attempts
        # storage: {mobile_number: {"otp": str, "expires_at": datetime, "attempts": int}}
        self._storage: Dict[str, Dict] = {}

    def generate_otp(self, mobile: str) -> str:
        """
        Generate a 6-digit secure numeric OTP and store it against the mobile number.
        """
        otp = "".join([str(secrets.randbelow(10)) for _ in range(6)])
        expires_at = datetime.utcnow() + timedelta(minutes=self.expiry_minutes)
        
        self._storage[mobile] = {
            "otp": otp,
            "expires_at": expires_at,
            "attempts": 0
        }
        
        # In development mode, we log the OTP
        logger.info(f"OTP for {mobile} is {otp}")
        
        return otp

    def verify_otp(self, mobile: str, otp: str) -> tuple[bool, str]:
        """
        Verify the OTP for a given mobile number.
        Returns (is_verified, message).
        """
        record = self._storage.get(mobile)
        
        if not record:
            return False, "OTP not found or already verified."
            
        if datetime.utcnow() > record["expires_at"]:
            del self._storage[mobile]
            return False, "OTP has expired."
            
        record["attempts"] += 1
        
        if record["attempts"] > self.max_attempts:
            del self._storage[mobile]
            return False, "Maximum attempts exceeded. Please request a new OTP."
            
        if record["otp"] != otp:
            return False, f"Invalid OTP. {self.max_attempts - record['attempts']} attempts remaining."
            
        # Success: remove from storage and return verified
        del self._storage[mobile]
        return True, "OTP verified successfully."

# Global instance for thread-safe (within process) access
otp_manager = OTPService()
