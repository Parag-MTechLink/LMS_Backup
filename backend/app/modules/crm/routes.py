from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.core.database import get_db
from app.modules.crm.models import CRMCustomer, CRMFieldMapping
from app.modules.crm.schemas import (
    CRMImportPayload,
    CRMCustomerResponse,
    CRMFieldMappingCreate,
    CRMFieldMappingResponse,
    CRMMigrateRequest,
    MigrationPreviewResponse,
    BulkMigrationResponse,
    BulkPreviewResponse,
    BulkPreviewRecord,
    CRMImportAndMigrateRequest,
    BulkImportProcessResponse,
    ImportConflict,
    CRMConnectionConfig,
    LMS_FIELDS,
)
from app.modules.projects.models import Customer
from app.modules.crm.connectors import SalesforceProvider, HubSpotProvider

router = APIRouter()

# ─── Helpers ──────────────────────────────────────────────────────────────────

def _apply_mappings(raw_data: dict, mappings: List) -> dict:
    """Helper to transform raw CRM data into LMS customer fields based on mappings."""
    # Handle both List[CRMFieldMapping] (from DB) and List[dict] (from Request)
    mapped = {}
    for m in mappings:
        crm_f = getattr(m, "crm_field", None) or m.get("crm_field")
        lms_f = getattr(m, "lms_field", None) or m.get("lms_field")
        
        if crm_f in raw_data and raw_data[crm_f] is not None:
            mapped[lms_f] = raw_data[crm_f]
    return mapped


@router.delete("/customers/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_crm_customer(customer_id: int, db: Session = Depends(get_db)):
    crm = db.query(CRMCustomer).filter(CRMCustomer.id == customer_id).first()
    if not crm:
        raise HTTPException(status_code=404, detail="CRM customer not found")
    db.delete(crm)
    db.commit()


@router.post("/migrate-all", response_model=BulkMigrationResponse)
def bulk_migrate_by_source(source_system: str, db: Session = Depends(get_db)):
    """
    Apply saved mappings for a specific source to all its pending/mapped records.
    """
    # 1. Get mappings for this source
    mappings = db.query(CRMFieldMapping).filter(CRMFieldMapping.source_system == source_system).all()
    if not mappings:
        raise HTTPException(status_code=400, detail=f"No field mappings defined for source '{source_system}'")
    
    # 2. Get pending records
    pending = db.query(CRMCustomer).filter(
        CRMCustomer.source_system == source_system,
        CRMCustomer.migration_status != "migrated"
    ).all()
    
    stats = {"total": len(pending), "success": 0, "conflicts": 0, "errors": 0}
    
    for crm in pending:
        try:
            mapped_fields = _apply_mappings(crm.raw_data, mappings)
            
            if "email" not in mapped_fields or not mapped_fields["email"]:
                stats["errors"] += 1
                continue
                
            # Check conflict
            existing = db.query(Customer).filter(Customer.email == mapped_fields["email"]).first()
            if existing:
                # Link if not already linked
                if not existing.crm_customer_id:
                    existing.crm_customer_id = crm.id
                crm.migration_status = "migrated"
                crm.mapped_customer_id = existing.id
                stats["success"] += 1
                continue

            # Create new
            new_cust = Customer(
                company_name=mapped_fields.get("company_name", "Unknown"),
                email=mapped_fields["email"],
                phone=mapped_fields.get("phone"),
                contact_person=mapped_fields.get("contact_person"),
                region=mapped_fields.get("region"),
                address=mapped_fields.get("address"),
                status="active",
                crm_customer_id=crm.id,
            )
            db.add(new_cust)
            db.flush()
            crm.migration_status = "migrated"
            crm.mapped_customer_id = new_cust.id
            stats["success"] += 1
            
        except Exception:
            stats["errors"] += 1
            
    db.commit()
    return stats

@router.post("/bulk-preview", response_model=BulkPreviewResponse)
def bulk_preview(db: Session = Depends(get_db)):
    """Analyze all pending CRM records across all sources to categorize them for bulk migration."""
    pending = db.query(CRMCustomer).filter(CRMCustomer.migration_status == "pending").all()
    
    # Cache mappings by source to avoid redundant DB hits
    source_mappings = {}
    sources = {c.source_system for c in pending}
    for s in sources:
        source_mappings[s] = db.query(CRMFieldMapping).filter(CRMFieldMapping.source_system == s).all()

    ready = []
    needs_attention = []

    for crm in pending:
        mappings = source_mappings.get(crm.source_system, [])
        rec = BulkPreviewRecord(
            id=crm.id,
            company_name=crm.raw_data.get("company_name") or crm.raw_data.get("AccountName") or "Unknown",
            email=crm.raw_data.get("email") or crm.raw_data.get("ContactEmail") or "No Email",
            source_system=crm.source_system,
            status="ready"
        )

        if not mappings:
            rec.status = "missing_mapping"
            rec.reason = "No rule presets (mappings) defined for this source"
            needs_attention.append(rec)
            continue

        mapped_fields = _apply_mappings(crm.raw_data, mappings)
        email = mapped_fields.get("email")

        if not email:
            rec.status = "missing_mapping"
            rec.reason = "Email field is not mapped or missing in record"
            needs_attention.append(rec)
        else:
            # Check conflict
            existing = db.query(Customer).filter(Customer.email == email).first()
            if existing:
                rec.status = "conflict"
                rec.reason = f"Email '{email}' already exists in LMS"
                needs_attention.append(rec)
            else:
                ready.append(rec)

    return BulkPreviewResponse(
        ready=ready,
        needs_attention=needs_attention,
        total_found=len(pending)
    )


# ─── Import ───────────────────────────────────────────────────────────────────

@router.post("/import", status_code=status.HTTP_201_CREATED)
def import_crm_records(payload: CRMImportPayload, db: Session = Depends(get_db)):
    """
    Bulk import raw CRM records. Each record is stored as-is in raw_data.
    No field mapping happens here — that comes in a later step.
    """
    created = []
    for record in payload.records:
        new = CRMCustomer(
            source_system=record.source_system,
            raw_data=record.raw_data,
            migration_status="pending",
        )
        db.add(new)
        db.flush()  # get id before commit
        created.append(new.id)
    db.commit()
    return {"imported": len(created), "ids": created}


# ─── List / Get ───────────────────────────────────────────────────────────────

@router.post("/import-and-migrate", response_model=BulkImportProcessResponse)
def import_and_migrate(request: CRMImportAndMigrateRequest, db: Session = Depends(get_db)):
    """
    1. Saves raw records to CRMCustomer table.
    2. Immediately applies mappings to migrate them to Customer table.
    3. Returns summary: migrated vs conflicts.
    """
    results = {"total": len(request.records), "migrated": 0, "already_migrated": 0, "conflicts": []}
    
    # Save mappings for future use/pre-fill
    email_crm_field = None
    for m in request.mappings:
        if m.lms_field == "email":
            email_crm_field = m.crm_field
        existing_map = db.query(CRMFieldMapping).filter(
            CRMFieldMapping.source_system == request.source_system,
            CRMFieldMapping.crm_field == m.crm_field,
        ).first()
        if existing_map:
            existing_map.lms_field = m.lms_field
        else:
            db.add(CRMFieldMapping(
                source_system=request.source_system,
                crm_field=m.crm_field,
                lms_field=m.lms_field,
            ))
    db.flush()

    for raw in request.records:
        # 1. Intelligent Deduplication Check
        crm = None
        email = raw.get(email_crm_field) if email_crm_field else None
        
        if email:
            # Check if this record already exists in CRMCustomer for this source
            crm = db.query(CRMCustomer).filter(
                CRMCustomer.source_system == request.source_system,
                CRMCustomer.raw_data[email_crm_field].astext == str(email)
            ).first()
            
            if crm:
                if crm.migration_status == "migrated":
                    results["already_migrated"] += 1
                    continue
                else:
                    # Update raw data and proceed to re-verify/migrate
                    crm.raw_data = raw
            
        if not crm:
            # Create NEW CRM record
            crm = CRMCustomer(
                source_system=request.source_system,
                raw_data=raw,
                migration_status="pending"
            )
            db.add(crm)
        
        db.flush() # get ID
        
        # Try to map
        mapped_fields = _apply_mappings(raw, request.mappings)
        if not email:
            results["conflicts"].append(ImportConflict(id=crm.id, raw_data=raw, reason="No email address mapped"))
            continue
            
        # Check for conflict in LMS Customer table
        existing_lms = db.query(Customer).filter(Customer.email == str(email)).first()
        if existing_lms:
            # Link it but mark as conflict for the wizard summary
            if not existing_lms.crm_customer_id:
                existing_lms.crm_customer_id = crm.id
            crm.migration_status = "pending" 
            results["conflicts"].append(ImportConflict(id=crm.id, raw_data=raw, reason=f"Email '{email}' already exists in LMS"))
            continue
            
        # Success: Migrate
        new_customer = Customer(
            company_name=mapped_fields.get("company_name", "Unknown"),
            email=str(email),
            phone=mapped_fields.get("phone"),
            contact_person=mapped_fields.get("contact_person"),
            region=mapped_fields.get("region"),
            address=mapped_fields.get("address"),
            status="active",
            crm_customer_id=crm.id,
        )
        db.add(new_customer)
        db.flush()
        
        crm.migration_status = "migrated"
        crm.mapped_customer_id = new_customer.id
        results["migrated"] += 1
        
    db.commit()
    return results


@router.get("/customers", response_model=List[CRMCustomerResponse])
def list_crm_customers(
    migration_status: str = None,
    db: Session = Depends(get_db)
):
    """List all CRM customers, optionally joined with LMS customer data."""
    q = db.query(
        CRMCustomer,
        Customer.company_name.label("mapped_company_name"),
        Customer.email.label("mapped_email")
    ).outerjoin(Customer, CRMCustomer.mapped_customer_id == Customer.id)
    
    if migration_status:
        q = q.filter(CRMCustomer.migration_status == migration_status)
    
    results = q.order_by(CRMCustomer.created_at.desc()).all()
    
    # Flatten the results for the response schema
    out = []
    for crm, name, email in results:
        crm.mapped_company_name = name
        crm.mapped_email = email
        out.append(crm)
    return out


@router.get("/customers/{customer_id}", response_model=CRMCustomerResponse)
def get_crm_customer(customer_id: int, db: Session = Depends(get_db)):
    res = db.query(
        CRMCustomer,
        Customer.company_name.label("mapped_company_name"),
        Customer.email.label("mapped_email")
    ).outerjoin(Customer, CRMCustomer.mapped_customer_id == Customer.id).filter(CRMCustomer.id == customer_id).first()
    
    if not res:
        raise HTTPException(status_code=404, detail="CRM customer not found")
    
    crm, name, email = res
    crm.mapped_company_name = name
    crm.mapped_email = email
    return crm


@router.get("/customers/{customer_id}/fields")
def get_crm_customer_fields(customer_id: int, db: Session = Depends(get_db)):
    """
    Returns the raw fields + sample values for a CRM record,
    along with the saved field mappings for its source system.
    Used to power the mapping wizard UI.
    """
    crm = db.query(CRMCustomer).filter(CRMCustomer.id == customer_id).first()
    if not crm:
        raise HTTPException(status_code=404, detail="CRM customer not found")

    # Saved mappings for this source
    saved = db.query(CRMFieldMapping).filter(
        CRMFieldMapping.source_system == crm.source_system
    ).all()
    saved_map = {m.crm_field: m.lms_field for m in saved}

    crm_fields = []
    for field, value in (crm.raw_data or {}).items():
        crm_fields.append({
            "crm_field": field,
            "sample_value": str(value)[:100] if value is not None else None,
            "suggested_lms_field": saved_map.get(field),  # pre-fill if already mapped
        })

    return {
        "crm_customer_id": crm.id,
        "source_system": crm.source_system,
        "migration_status": crm.migration_status,
        "crm_fields": crm_fields,
        "lms_fields": LMS_FIELDS,
    }


# ─── Field Mappings (per source system) ──────────────────────────────────────

@router.get("/mappings/{source_system}", response_model=List[CRMFieldMappingResponse])
def get_mappings(source_system: str, db: Session = Depends(get_db)):
    """Returns all saved field mappings for a specific source system."""
    return db.query(CRMFieldMapping).filter(
        CRMFieldMapping.source_system == source_system
    ).all()


@router.post("/mappings", response_model=CRMFieldMappingResponse)
def save_mapping(mapping: CRMFieldMappingCreate, db: Session = Depends(get_db)):
    """Save or update a field mapping (upsert by source_system + crm_field)."""
    if mapping.lms_field not in LMS_FIELDS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid lms_field '{mapping.lms_field}'. Must be one of: {LMS_FIELDS}"
        )
    existing = db.query(CRMFieldMapping).filter(
        CRMFieldMapping.source_system == mapping.source_system,
        CRMFieldMapping.crm_field == mapping.crm_field,
    ).first()
    if existing:
        existing.lms_field = mapping.lms_field
        db.commit()
        db.refresh(existing)
        return existing

    new_map = CRMFieldMapping(**mapping.model_dump())
    db.add(new_map)
    db.commit()
    db.refresh(new_map)
    return new_map


@router.delete("/mappings/{mapping_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_mapping(mapping_id: int, db: Session = Depends(get_db)):
    m = db.query(CRMFieldMapping).filter(CRMFieldMapping.id == mapping_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mapping not found")
    db.delete(m)
    db.commit()


# ─── Migration Preview ────────────────────────────────────────────────────────

@router.post("/customers/{customer_id}/preview", response_model=MigrationPreviewResponse)
def preview_migration(
    customer_id: int,
    request: CRMMigrateRequest,
    db: Session = Depends(get_db),
):
    """
    Dry-run: apply the provided mappings to the CRM record and return what
    would be written to the LMS customers table, plus any conflicts.
    """
    crm = db.query(CRMCustomer).filter(CRMCustomer.id == customer_id).first()
    if not crm:
        raise HTTPException(status_code=404, detail="CRM customer not found")

    mapped_fields = _apply_mappings(crm.raw_data, request.mappings)
    mapped_crm_keys = {m.crm_field for m in request.mappings}
    unmapped = [f for f in (crm.raw_data or {}).keys() if f not in mapped_crm_keys]

    conflicts = []
    if "email" in mapped_fields:
        existing = db.query(Customer).filter(
            Customer.email == mapped_fields["email"],
            Customer.crm_customer_id != customer_id,
        ).first()
        if existing:
            conflicts.append(f"Email '{mapped_fields['email']}' already exists in LMS (Customer ID: {existing.id})")

    return MigrationPreviewResponse(
        crm_customer_id=customer_id,
        source_system=crm.source_system,
        mapped_fields=mapped_fields,
        unmapped_fields=unmapped,
        conflicts=conflicts,
    )


# ─── Migrate ─────────────────────────────────────────────────────────────────

@router.post("/customers/{customer_id}/migrate", status_code=status.HTTP_201_CREATED)
def migrate_to_lms(
    customer_id: int,
    request: CRMMigrateRequest,
    db: Session = Depends(get_db),
):
    """
    Apply mappings and write to LMS customers table.
    - Uses provided mappings (from the wizard UI).
    - Saves mappings back to crm_field_mappings for reuse.
    - Updates CRM record status to 'migrated'.
    """
    crm = db.query(CRMCustomer).filter(CRMCustomer.id == customer_id).first()
    if not crm:
        raise HTTPException(status_code=404, detail="CRM customer not found")

    if crm.migration_status == "migrated":
        return {"message": "Already migrated", "customer_id": crm.mapped_customer_id}

    mapped_fields = _apply_mappings(crm.raw_data, request.mappings)

    if "email" not in mapped_fields or not mapped_fields["email"]:
        raise HTTPException(status_code=400, detail="'email' field must be mapped before migrating")

    # Check for existing LMS customer by email
    existing = db.query(Customer).filter(Customer.email == mapped_fields["email"]).first()
    if existing:
        # Link it and mark as migrated
        existing.crm_customer_id = customer_id
        crm.migration_status = "migrated"
        crm.mapped_customer_id = existing.id
        db.commit()
        return {"message": "Linked to existing LMS customer", "customer_id": existing.id}

    # Create new LMS customer from mapped fields
    new_customer = Customer(
        company_name=mapped_fields.get("company_name", "Unknown"),
        email=mapped_fields["email"],
        phone=mapped_fields.get("phone"),
        contact_person=mapped_fields.get("contact_person"),
        region=mapped_fields.get("region"),
        address=mapped_fields.get("address"),
        status="active",
        crm_customer_id=customer_id,
    )
    db.add(new_customer)
    db.flush()

    # Save mappings for reuse
    for m in request.mappings:
        existing_map = db.query(CRMFieldMapping).filter(
            CRMFieldMapping.source_system == crm.source_system,
            CRMFieldMapping.crm_field == m.crm_field,
        ).first()
        if existing_map:
            existing_map.lms_field = m.lms_field
        else:
            db.add(CRMFieldMapping(
                source_system=crm.source_system,
                crm_field=m.crm_field,
                lms_field=m.lms_field,
            ))

    crm.migration_status = "migrated"
    crm.mapped_customer_id = new_customer.id
    db.commit()

    return {"message": "Migration successful", "customer_id": new_customer.id}


# ─── OAuth & Sync Connections ───────────────────────────────────────────────

@router.get("/connections")
def list_connections(db: Session = Depends(get_db)):
    """Check status of CRM connections (Salesforce, HubSpot)."""
    from app.modules.crm.models import CRMConnection
    conns = db.query(CRMConnection).all()
    return [{
        "provider": c.provider,
        "is_active": c.is_active,
        "is_configured": bool(c.client_id and c.client_secret),
        "last_sync_at": c.last_sync_at
    } for c in conns]

@router.put("/connections/{provider}/config")
async def update_connection_config(provider: str, config: CRMConnectionConfig, db: Session = Depends(get_db)):
    """Saves (encrypted) API credentials for the CRM provider."""
    from app.modules.crm.models import CRMConnection
    from app.modules.crm.connectors import CRMProvider
    
    conn = db.query(CRMConnection).filter(CRMConnection.provider == provider).first()
    if not conn:
        conn = CRMConnection(provider=provider)
        db.add(conn)
    
    # Use CRMProvider's encryption
    p = CRMProvider(db)
    conn.client_id = p.encrypt(config.client_id)
    conn.client_secret = p.encrypt(config.client_secret)
    db.commit()
    return {"message": f"{provider} configuration updated."}

@router.get("/auth/{provider}")
def get_auth_url(provider: str, db: Session = Depends(get_db)):
    """Returns the redirect URL to start OAuth login with the CRM provider."""
    if provider == "salesforce":
        return {"url": SalesforceProvider(db).get_auth_url()}
    if provider == "hubspot":
        return {"url": HubSpotProvider(db).get_auth_url()}
    raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")

@router.get("/auth/{provider}/callback")
async def oauth_callback(provider: str, code: str, db: Session = Depends(get_db)):
    """Handles the OAuth redirect from the provider after user login."""
    try:
        if provider == "salesforce":
            await SalesforceProvider(db).exchange_code(code)
            return {"message": "Salesforce connected successfully."}
        raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sync/{provider}")
async def sync_crm(provider: str, db: Session = Depends(get_db)):
    """Triggers a manual fetch of new leads from the connected CRM."""
    try:
        if provider == "salesforce":
            new_leads = await SalesforceProvider(db).fetch_leads()
            return {"message": f"Sync complete. Found {new_leads} new leads."}
        raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
