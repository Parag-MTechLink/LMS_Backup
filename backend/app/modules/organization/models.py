"""
SQLAlchemy Models for Organization Module
Database models for all organization-related tables
"""
from sqlalchemy import Column, String, Text, Boolean, Integer, Float, Date, Time, ForeignKey, Enum as SQLEnum, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class OrganizationStatus(str, enum.Enum):
    """Organization status enum"""
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"


class Organization(Base):
    """Main organization/laboratory table"""
    __tablename__ = "organizations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Laboratory Details
    lab_name = Column(String(255), nullable=False)
    lab_address = Column(Text, nullable=False)
    lab_country = Column(String(100), default="India")
    lab_state = Column(String(100), nullable=False)
    lab_district = Column(String(100), nullable=True)
    lab_city = Column(String(100), nullable=False)
    lab_pin_code = Column(String(10), nullable=False)
    lab_logo_url = Column(String(500))
    lab_proof_of_address = Column(String(255))
    lab_proof_of_address_other = Column(String(255))
    lab_document_id = Column(String(100))
    lab_address_proof_url = Column(String(500))
    
    # Status and timestamps
    status = Column(SQLEnum(OrganizationStatus), default=OrganizationStatus.DRAFT)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    registered_office = relationship("RegisteredOffice", back_populates="organization", uselist=False, cascade="all, delete-orphan")
    top_management = relationship("TopManagement", back_populates="organization", cascade="all, delete-orphan")
    parent_organization = relationship("ParentOrganization", back_populates="organization", uselist=False, cascade="all, delete-orphan")
    bank_details = relationship("BankDetails", back_populates="organization", uselist=False, cascade="all, delete-orphan")
    working_schedule = relationship("WorkingSchedule", back_populates="organization", uselist=False, cascade="all, delete-orphan")
    shift_timings = relationship("ShiftTiming", back_populates="organization", cascade="all, delete-orphan")
    compliance_documents = relationship("ComplianceDocument", back_populates="organization", cascade="all, delete-orphan")
    policy_documents = relationship("PolicyDocuments", back_populates="organization", uselist=False, cascade="all, delete-orphan")
    infrastructure = relationship("InfrastructureDetails", back_populates="organization", uselist=False, cascade="all, delete-orphan")
    accreditation_documents = relationship("AccreditationDocument", back_populates="organization", cascade="all, delete-orphan")
    other_details = relationship("OtherLabDetails", back_populates="organization", uselist=False, cascade="all, delete-orphan")
    quality_manual = relationship("QualityManual", back_populates="organization", uselist=False, cascade="all, delete-orphan")
    sops = relationship("SOP", back_populates="organization", cascade="all, delete-orphan")
    quality_formats = relationship("QualityFormat", back_populates="organization", cascade="all, delete-orphan")
    quality_procedures = relationship("QualityProcedure", back_populates="organization", cascade="all, delete-orphan")


class RegisteredOffice(Base):
    """Registered office details"""
    __tablename__ = "registered_offices"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    
    same_as_lab_address = Column(Boolean, default=False)
    address = Column(Text)
    country = Column(String(100), default="India")
    state = Column(String(100))
    district = Column(String(100))
    city = Column(String(100))
    pin_code = Column(String(10))
    mobile = Column(String(20))
    telephone = Column(String(20))
    fax = Column(String(20))
    top_management_document_url = Column(String(500))
    
    organization = relationship("Organization", back_populates="registered_office")


class TopManagement(Base):
    """Top management members"""
    __tablename__ = "top_management"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(255), nullable=False)
    designation = Column(String(255), nullable=False)
    mobile = Column(String(20), nullable=False)
    telephone = Column(String(20))
    fax = Column(String(20))
    order_index = Column(Integer, default=0)
    
    organization = relationship("Organization", back_populates="top_management")


class ParentOrganization(Base):
    """Parent organization details"""
    __tablename__ = "parent_organizations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    
    same_as_laboratory = Column(Boolean, default=False)
    name = Column(String(255))
    address = Column(Text)
    country = Column(String(100), default="India")
    state = Column(String(100))
    district = Column(String(100))
    city = Column(String(100))
    pin_code = Column(String(10))
    
    organization = relationship("Organization", back_populates="parent_organization")


class BankDetails(Base):
    """Bank account details"""
    __tablename__ = "bank_details"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    
    account_holder_name = Column(String(255))
    account_number = Column(String(50))
    ifsc_code = Column(String(11))
    branch_name = Column(String(255))
    gst_number = Column(String(15))
    cancelled_cheque_url = Column(String(500))
    
    organization = relationship("Organization", back_populates="bank_details")


class WorkingSchedule(Base):
    """Working schedule and organization type"""
    __tablename__ = "working_schedules"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    
    working_days = Column(JSONB)  # ["Mon", "Tue", "Wed", ...]
    organization_type = Column(String(100))
    organization_type_other = Column(String(255))
    proof_of_legal_identity = Column(String(255))
    proof_of_legal_identity_other = Column(String(255))
    legal_identity_document_id = Column(String(100))
    legal_identity_document_url = Column(String(500))
    
    organization = relationship("Organization", back_populates="working_schedule")


class ShiftTiming(Base):
    """Shift timings"""
    __tablename__ = "shift_timings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    
    shift_from = Column(Time, nullable=False)
    shift_to = Column(Time, nullable=False)
    order_index = Column(Integer, default=0)
    
    organization = relationship("Organization", back_populates="shift_timings")


class ComplianceDocument(Base):
    """Statutory compliance documents"""
    __tablename__ = "compliance_documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    
    document_type = Column(String(100))
    document_type_other = Column(String(255))
    document_id = Column(String(100))
    file_url = Column(String(500))
    
    organization = relationship("Organization", back_populates="compliance_documents")


class PolicyDocuments(Base):
    """Policy documents (undertakings)"""
    __tablename__ = "policy_documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    
    impartiality_document_url = Column(String(500))
    terms_conditions_document_url = Column(String(500))
    code_of_ethics_document_url = Column(String(500))
    testing_charges_policy_document_url = Column(String(500))
    
    organization = relationship("Organization", back_populates="policy_documents")


class InfrastructureDetails(Base):
    """Power and water infrastructure"""
    __tablename__ = "infrastructure_details"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    
    adequacy_sanctioned_load = Column(Text)
    availability_uninterrupted_power = Column(Boolean, default=False)
    stability_of_supply = Column(Boolean, default=False)
    water_source = Column(String(50))
    
    organization = relationship("Organization", back_populates="infrastructure")


class AccreditationDocument(Base):
    """Accreditation and certification documents"""
    __tablename__ = "accreditation_documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    
    certification_type = Column(String(100))
    certification_type_other = Column(String(255))
    certificate_no = Column(String(100))
    certificate_file_url = Column(String(500))
    scope_file_url = Column(String(500))
    
    organization = relationship("Organization", back_populates="accreditation_documents")


class OtherLabDetails(Base):
    """Other laboratory details"""
    __tablename__ = "other_lab_details"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    
    other_details = Column(Text)
    other_details_document_url = Column(String(500))
    layout_lab_premises_url = Column(String(500))
    organization_chart_url = Column(String(500))
    gps_latitude = Column(Float)
    gps_longitude = Column(Float)
    
    organization = relationship("Organization", back_populates="other_details")


class QualityManual(Base):
    """Quality manual details"""
    __tablename__ = "quality_manuals"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    
    title = Column(String(255))
    issue_number = Column(String(50))
    issue_date = Column(Date)
    amendments = Column(String(255))
    document_url = Column(String(500))
    
    organization = relationship("Organization", back_populates="quality_manual")


class SOP(Base):
    """Standard Operating Procedures"""
    __tablename__ = "sops"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    
    title = Column(String(255))
    number = Column(String(50))
    issue_number = Column(String(50))
    issue_date = Column(Date)
    amendments = Column(String(255))
    order_index = Column(Integer, default=0)
    
    organization = relationship("Organization", back_populates="sops")


class QualityFormat(Base):
    """Quality formats"""
    __tablename__ = "quality_formats"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    
    title = Column(String(255))
    number = Column(String(50))
    issue_number = Column(String(50))
    issue_date = Column(Date)
    amendments = Column(String(255))
    order_index = Column(Integer, default=0)
    
    organization = relationship("Organization", back_populates="quality_formats")


class QualityProcedure(Base):
    """Quality procedures"""
    __tablename__ = "quality_procedures"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    
    title = Column(String(255))
    number = Column(String(50))
    file_url = Column(String(500))
    issue_number = Column(String(50))
    issue_date = Column(Date)
    amendments = Column(String(255))
    order_index = Column(Integer, default=0)
    
    organization = relationship("Organization", back_populates="quality_procedures")
