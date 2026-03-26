from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
from app.core.database import Base


class CRMCustomer(Base):
    """
    Stores raw customer records imported from external CRM platforms
    (Salesforce, HubSpot, CSV etc.) as-is, without assuming field names.
    A separate field mapping step resolves synonyms before migrating to LMS.
    """
    __tablename__ = "crm_customers"

    id = Column(Integer, primary_key=True, index=True)

    # Which CRM this record came from
    source_system = Column(String(100), nullable=False, default="manual")  # salesforce, hubspot, csv, manual

    # Raw payload from the CRM — all fields preserved, no schema assumed
    raw_data = Column(JSONB, nullable=False)

    # Workflow status
    migration_status = Column(String(50), nullable=False, default="pending")
    # Values: pending | mapped | migrated | skipped

    # Once migrated, points to the LMS customer record
    mapped_customer_id = Column(Integer, ForeignKey("customers.id", ondelete="SET NULL"), nullable=True)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class CRMFieldMapping(Base):
    """
    Stores reusable field-name mappings per source system.
    e.g. Salesforce "contact_number" → LMS "phone"
    Once saved, these are auto-applied for future imports from the same source.
    """
    __tablename__ = "crm_field_mappings"

    id = Column(Integer, primary_key=True, index=True)
    source_system = Column(String(100), nullable=False, index=True)  # "salesforce"
    crm_field = Column(String(255), nullable=False)                   # "contact_number"
    lms_field = Column(String(255), nullable=False)                   # "phone"
    # lms_field must be one of: company_name, email, phone, contact_person, region, address

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class CRMConnection(Base):
    """
    Stores OAuth credentials for external CRM providers (Salesforce, HubSpot).
    """
    __tablename__ = "crm_connections"

    id = Column(Integer, primary_key=True, index=True)
    provider = Column(String(50), nullable=False, unique=True)  # salesforce, hubspot
    
    # UI-Configurable credentials (encrypted)
    client_id = Column(String(1024), nullable=True)
    client_secret = Column(String(1024), nullable=True)
    
    # Encrypted tokens (logic for encryption in connectors.py)
    access_token = Column(String(2048), nullable=True)
    refresh_token = Column(String(2048), nullable=True)
    
    # Provider-specific metadata
    instance_url = Column(String(255), nullable=True) # For Salesforce
    
    expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    last_sync_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
