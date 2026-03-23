import base64
import json
import httpx
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from cryptography.fernet import Fernet
from sqlalchemy.orm import Session
from app.core.config import settings
from app.modules.crm.models import CRMConnection, CRMCustomer

# Use a consistent key for encryption (should ideally be in settings)
# For now, let's use a derived key from JWT_SECRET_KEY or similar
# IMPORTANT: In a real prod env, this must be a proper Fernet key.
ENCRYPTION_KEY = base64.urlsafe_b64encode(settings.JWT_SECRET_KEY.ljust(32)[:32].encode())
cipher = Fernet(ENCRYPTION_KEY)

class CRMProvider:
    def __init__(self, db: Session):
        self.db = db
        self.provider_name = ""

    def encrypt(self, text: str) -> str:
        if not text: return None
        return cipher.encrypt(text.encode()).decode()

    def decrypt(self, encrypted_text: str) -> str:
        if not encrypted_text: return None
        return cipher.decrypt(encrypted_text.encode()).decode()

    def get_connection(self) -> Optional[CRMConnection]:
        return self.db.query(CRMConnection).filter(CRMConnection.provider == self.provider_name).first()

    async def get_valid_token(self) -> Optional[str]:
        conn = self.get_connection()
        if not conn:
            return None
        
        # Check if expired
        if conn.expires_at and conn.expires_at < datetime.utcnow():
            await self.refresh_token(conn)
            self.db.refresh(conn)
            
        return self.decrypt(conn.access_token)

    async def refresh_token(self, conn: CRMConnection):
        """Standard OAuth2 refresh token flow."""
        if not conn.refresh_token: return
        
        refresh_token = self.decrypt(conn.refresh_token)
        url = "https://login.salesforce.com/services/oauth2/token" if self.provider_name == "salesforce" else "https://api.hubapi.com/oauth/v1/token"
        
        data = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
        }
        
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, data=data)
            if resp.status_code == 200:
                tokens = resp.json()
                conn.access_token = self.encrypt(tokens["access_token"])
                if "refresh_token" in tokens:
                    conn.refresh_token = self.encrypt(tokens["refresh_token"])
                conn.expires_at = datetime.utcnow() + timedelta(seconds=tokens.get("expires_in", 3600))
                self.db.commit()

class SalesforceProvider(CRMProvider):
    def __init__(self, db: Session):
        super().__init__(db)
        self.provider_name = "salesforce"
        
        # Check DB for UI-configured credentials first
        conn = self.get_connection()
        db_id = self.decrypt(conn.client_id) if conn and conn.client_id else None
        db_secret = self.decrypt(conn.client_secret) if conn and conn.client_secret else None
        
        self.client_id = db_id or getattr(settings, "SALESFORCE_CLIENT_ID", "")
        self.client_secret = db_secret or getattr(settings, "SALESFORCE_CLIENT_SECRET", "")
        self.redirect_uri = f"{settings.HOST}/api/v1/crm/auth/salesforce/callback"

    def get_auth_url(self) -> str:
        base_url = "https://login.salesforce.com/services/oauth2/authorize"
        params = {
            "response_type": "code",
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": "full refresh_token"
        }
        query = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"{base_url}?{query}"

    async def exchange_code(self, code: str):
        url = "https://login.salesforce.com/services/oauth2/token"
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": self.redirect_uri
        }
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, data=data)
            if resp.status_code != 200:
                raise Exception(f"Failed to exchange code: {resp.text}")
            
            tokens = resp.json()
            # Save or Update Connection
            conn = self.get_connection()
            if not conn:
                conn = CRMConnection(provider=self.provider_name)
                self.db.add(conn)
            
            conn.access_token = self.encrypt(tokens["access_token"])
            if "refresh_token" in tokens:
                conn.refresh_token = self.encrypt(tokens["refresh_token"])
            
            conn.instance_url = tokens.get("instance_url")
            # Salesforce tokens usually expire in 2 hours
            conn.expires_at = datetime.utcnow() + timedelta(seconds=7200)
            conn.is_active = True
            self.db.commit()
            return tokens

    async def fetch_leads(self):
        token = await self.get_valid_token()
        conn = self.get_connection()
        if not token or not conn or not conn.instance_url:
            return []

        # SOQL query
        query = "SELECT Id, FirstName, LastName, Company, Email, Phone, City, Country FROM Lead WHERE IsConverted = false LIMIT 100"
        url = f"{conn.instance_url}/services/data/v59.0/query?q={query}"
        
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {token}"}
            resp = await client.get(url, headers=headers)
            if resp.status_code != 200:
                raise Exception(f"SF API Error: {resp.text}")
            
            data = resp.json()
            records = data.get("records", [])
            
            # Save to CRMCustomer
            new_records = 0
            for sf_lead in records:
                # Deduplicate based on SF Id
                exists = self.db.query(CRMCustomer).filter(
                    CRMCustomer.source_system == self.provider_name,
                    CRMCustomer.raw_data['Id'].astext == sf_lead['Id']
                ).first()
                
                if not exists:
                    new_lead = CRMCustomer(
                        source_system=self.provider_name,
                        raw_data=sf_lead,
                        migration_status="pending"
                    )
                    self.db.add(new_lead)
                    new_records += 1
            
            conn.last_sync_at = datetime.utcnow()
            self.db.commit()
            return new_records

class HubSpotProvider(CRMProvider):
    def __init__(self, db: Session):
        super().__init__(db)
        self.provider_name = "hubspot"
        
        conn = self.get_connection()
        db_id = self.decrypt(conn.client_id) if conn and conn.client_id else None
        db_secret = self.decrypt(conn.client_secret) if conn and conn.client_secret else None
        
        self.client_id = db_id or getattr(settings, "HUBSPOT_CLIENT_ID", "")
        self.client_secret = db_secret or getattr(settings, "HUBSPOT_CLIENT_SECRET", "")
        self.redirect_uri = f"{settings.HOST}/api/v1/crm/auth/hubspot/callback"

    def get_auth_url(self) -> str:
        base_url = "https://app.hubspot.com/oauth/authorize"
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": "crm.objects.contacts.read crm.objects.contacts.write",
        }
        query = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"{base_url}?{query}"

    async def exchange_code(self, code: str):
        url = "https://api.hubapi.com/oauth/v1/token"
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": self.redirect_uri
        }
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, data=data)
            if resp.status_code != 200:
                raise Exception(f"HubSpot code exchange failed: {resp.text}")
            
            tokens = resp.json()
            conn = self.get_connection()
            if not conn:
                conn = CRMConnection(provider=self.provider_name)
                self.db.add(conn)
            
            conn.access_token = self.encrypt(tokens["access_token"])
            if "refresh_token" in tokens:
                conn.refresh_token = self.encrypt(tokens["refresh_token"])
            
            conn.expires_at = datetime.utcnow() + timedelta(seconds=tokens.get("expires_in", 3600))
            conn.is_active = True
            self.db.commit()
            return tokens

    async def fetch_leads(self):
        token = await self.get_valid_token()
        if not token: return []

        url = "https://api.hubapi.com/crm/v3/objects/contacts?properties=firstname,lastname,company,email,phone"
        
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {token}"}
            resp = await client.get(url, headers=headers)
            if resp.status_code != 200:
                raise Exception(f"HubSpot API Error: {resp.text}")
            
            data = resp.json()
            records = data.get("results", [])
            
            new_records = 0
            for contact in records:
                props = contact.get("properties", {})
                # Flatten props for easier mapping
                raw = {
                    "Id": contact["id"],
                    "FirstName": props.get("firstname"),
                    "LastName": props.get("lastname"),
                    "company_name": props.get("company"),
                    "email": props.get("email"),
                    "phone": props.get("phone")
                }
                
                exists = self.db.query(CRMCustomer).filter(
                    CRMCustomer.source_system == self.provider_name,
                    CRMCustomer.raw_data['Id'].astext == contact['id']
                ).first()
                
                if not exists:
                    new_lead = CRMCustomer(
                        source_system=self.provider_name,
                        raw_data=raw,
                        migration_status="pending"
                    )
                    self.db.add(new_lead)
                    new_records += 1
            
            conn = self.get_connection()
            conn.last_sync_at = datetime.utcnow()
            self.db.commit()
            return new_records
