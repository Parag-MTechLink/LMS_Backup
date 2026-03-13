"""
Application Configuration
Manages environment variables and settings using Pydantic
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List
import os


def _clean_database_url(v: str) -> str:
    """Strip common copy-paste mistakes: leading 'psql ', surrounding quotes."""
    if not isinstance(v, str):
        return v
    v = v.strip()
    if v.lower().startswith("psql "):
        v = v[5:].strip()
    if (v.startswith("'") and v.endswith("'")) or (v.startswith('"') and v.endswith('"')):
        v = v[1:-1].strip()
    return v


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_NAME: str = "LMS Backend"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "your-secret-key-change-this"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8001
    
    # Database
    DATABASE_URL: str
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def clean_database_url(cls, v: str) -> str:
        return _clean_database_url(v) if v else v
    
    # CORS (comma-separated string)
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Get CORS origins as list"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    # File Upload
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
    MAX_FILE_SIZE: int = 2097152  # 2MB
    MAX_IMAGE_SIZE: int = 1048576  # 1MB
    ALLOWED_IMAGE_TYPES: str = "image/jpeg,image/png,image/jpg"
    ALLOWED_DOCUMENT_TYPES: str = "application/pdf"
    
    # Storage
    STORAGE_TYPE: str = "local"  # local or s3
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = ""
    AWS_BUCKET_NAME: str = ""
    
    # JWT (if using authentication). Use at least 32 characters for HS256 (RFC 7518).
    JWT_SECRET_KEY: str = "your-jwt-secret-min-32-chars-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Lab recommendation engine (separate DB: labs, tests, standards, domains)
    LAB_ENGINE_DATABASE_URL: str = ""

    # Chatbot / Hybrid RAG
    OPENAI_API_KEY: str = ""
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    CHAT_MODEL: str = "gpt-4o-mini"
    RAG_TOP_K: int = 3
    RAG_SIMILARITY_THRESHOLD: float = 0.7
    EMBEDDING_DIMENSION: int = 1536
    
    # SMTP / Email Settings
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    MAIL_FROM: str = ""
    
    # Reset Password
    RESET_TOKEN_EXPIRE_MINUTES: int = 30

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra='ignore'  # Ignore extra fields in .env
    )
    
    @property
    def allowed_image_types_list(self) -> List[str]:
        """Get allowed image types as list"""
        return [t.strip() for t in self.ALLOWED_IMAGE_TYPES.split(",")]
    
    @property
    def allowed_document_types_list(self) -> List[str]:
        """Get allowed document types as list"""
        return [t.strip() for t in self.ALLOWED_DOCUMENT_TYPES.split(",")]


# Create settings instance
settings = Settings()
