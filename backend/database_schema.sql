-- LMS Database Schema for NeonDB
-- This file contains the complete database schema for the Lab Management System

-- Enable UUID extension (if needed)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'engineer',
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CUSTOMERS & RFQs
-- ============================================

CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    customer_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rfqs (
    id SERIAL PRIMARY KEY,
    rfq_id VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE estimations (
    id SERIAL PRIMARY KEY,
    rfq_id INTEGER REFERENCES rfqs(id) ON DELETE CASCADE,
    item VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PROJECTS & TEST MANAGEMENT
-- ============================================

CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    project_id VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Active',
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE test_plans (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE test_executions (
    id SERIAL PRIMARY KEY,
    test_plan_id INTEGER REFERENCES test_plans(id) ON DELETE CASCADE,
    execution_id VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    result TEXT,
    executed_by VARCHAR(255),
    executed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE samples (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    sample_id VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Received',
    received_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INVENTORY MANAGEMENT
-- ============================================

CREATE TABLE instruments (
    id SERIAL PRIMARY KEY,
    instrument_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    serial_number VARCHAR(255),
    lab_location VARCHAR(255),
    assigned_department VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Active',
    purchase_date DATE,
    warranty_expiry DATE,
    service_vendor VARCHAR(255),
    service_vendor_contact VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE calibrations (
    id SERIAL PRIMARY KEY,
    instrument_id INTEGER REFERENCES instruments(id) ON DELETE CASCADE,
    calibration_id VARCHAR(50) UNIQUE NOT NULL,
    last_calibration_date DATE NOT NULL,
    next_due_date DATE NOT NULL,
    calibration_frequency VARCHAR(50),
    calibration_method VARCHAR(255),
    certified_by VARCHAR(255),
    certificate_number VARCHAR(255),
    certificate_url TEXT,
    status VARCHAR(50) DEFAULT 'Valid',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE consumables (
    id SERIAL PRIMARY KEY,
    item_id VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    batch_number VARCHAR(255),
    quantity INTEGER NOT NULL DEFAULT 0,
    unit VARCHAR(50),
    expiry_date DATE,
    storage_conditions TEXT,
    supplier VARCHAR(255),
    low_stock_threshold INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory_transactions (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(50) UNIQUE NOT NULL,
    item_id INTEGER NOT NULL,
    item_type VARCHAR(50) NOT NULL, -- 'Consumable' or 'Accessory'
    transaction_type VARCHAR(50) NOT NULL, -- 'Usage', 'Addition', 'Wastage'
    quantity INTEGER NOT NULL,
    used_by VARCHAR(255),
    purpose TEXT,
    transaction_date DATE NOT NULL,
    linked_test_id INTEGER REFERENCES test_executions(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- QUALITY ASSURANCE
-- ============================================

CREATE TABLE sops (
    id SERIAL PRIMARY KEY,
    sop_id VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    version VARCHAR(50) NOT NULL,
    effective_date DATE NOT NULL,
    approved_by VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'Active',
    document_url TEXT,
    next_review_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sop_revisions (
    id SERIAL PRIMARY KEY,
    sop_id INTEGER REFERENCES sops(id) ON DELETE CASCADE,
    version VARCHAR(50) NOT NULL,
    revision_date DATE NOT NULL,
    changed_by VARCHAR(255) NOT NULL,
    changes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sop_links (
    id SERIAL PRIMARY KEY,
    sop_id INTEGER REFERENCES sops(id) ON DELETE CASCADE,
    link_type VARCHAR(50) NOT NULL, -- 'Test', 'Instrument', 'Department'
    linked_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE qc_checks (
    id SERIAL PRIMARY KEY,
    qc_id VARCHAR(50) UNIQUE NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    parameter VARCHAR(255) NOT NULL,
    target_value DECIMAL(10, 2) NOT NULL,
    acceptance_min DECIMAL(10, 2) NOT NULL,
    acceptance_max DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50),
    frequency VARCHAR(50),
    last_check_date DATE,
    last_result DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'Pass',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE qc_results (
    id SERIAL PRIMARY KEY,
    qc_check_id INTEGER REFERENCES qc_checks(id) ON DELETE CASCADE,
    result_value DECIMAL(10, 2) NOT NULL,
    check_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL,
    deviation BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audits (
    id SERIAL PRIMARY KEY,
    audit_id VARCHAR(50) UNIQUE NOT NULL,
    audit_type VARCHAR(50) NOT NULL, -- 'Internal' or 'External'
    audit_date DATE NOT NULL,
    auditor_name VARCHAR(255) NOT NULL,
    auditor_organization VARCHAR(255),
    scope TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Scheduled',
    compliance_score INTEGER,
    report_url TEXT,
    next_audit_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_findings (
    id SERIAL PRIMARY KEY,
    audit_id INTEGER REFERENCES audits(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    severity VARCHAR(50) NOT NULL, -- 'Minor', 'Major', 'Critical'
    status VARCHAR(50) DEFAULT 'Open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE nc_capas (
    id SERIAL PRIMARY KEY,
    nc_id VARCHAR(50) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    impacted_area VARCHAR(255) NOT NULL,
    severity VARCHAR(50) NOT NULL, -- 'Low', 'Medium', 'High'
    root_cause TEXT NOT NULL,
    action_owner VARCHAR(255) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Open',
    corrective_action TEXT NOT NULL,
    preventive_action TEXT,
    closure_date DATE,
    linked_audit_id INTEGER REFERENCES audits(id) ON DELETE SET NULL,
    linked_test_id INTEGER REFERENCES test_executions(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    document_id VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    effective_date DATE NOT NULL,
    approved_by VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'Active',
    access_level VARCHAR(100) DEFAULT 'All Staff',
    locked BOOLEAN DEFAULT FALSE,
    document_url TEXT,
    download_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE document_revisions (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    version VARCHAR(50) NOT NULL,
    revision_date DATE NOT NULL,
    changed_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ORGANIZATION & SCOPE
-- ============================================

CREATE TABLE organization_details (
    id SERIAL PRIMARY KEY,
    field_name VARCHAR(255) NOT NULL,
    field_value TEXT,
    field_type VARCHAR(50), -- 'text', 'date', 'number', 'json'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE scope_management (
    id SERIAL PRIMARY KEY,
    scope_type VARCHAR(100) NOT NULL,
    scope_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES for Performance
-- ============================================

CREATE INDEX idx_instruments_status ON instruments(status);
CREATE INDEX idx_calibrations_next_due_date ON calibrations(next_due_date);
CREATE INDEX idx_consumables_expiry_date ON consumables(expiry_date);
CREATE INDEX idx_consumables_quantity ON consumables(quantity);
CREATE INDEX idx_inventory_transactions_date ON inventory_transactions(transaction_date);
CREATE INDEX idx_sops_status ON sops(status);
CREATE INDEX idx_qc_checks_status ON qc_checks(status);
CREATE INDEX idx_audits_status ON audits(status);
CREATE INDEX idx_nc_capas_status ON nc_capas(status);
CREATE INDEX idx_nc_capas_due_date ON nc_capas(due_date);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_test_executions_status ON test_executions(status);

-- ============================================
-- TRIGGERS for updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instruments_updated_at BEFORE UPDATE ON instruments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calibrations_updated_at BEFORE UPDATE ON calibrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consumables_updated_at BEFORE UPDATE ON consumables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sops_updated_at BEFORE UPDATE ON sops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audits_updated_at BEFORE UPDATE ON audits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nc_capas_updated_at BEFORE UPDATE ON nc_capas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
