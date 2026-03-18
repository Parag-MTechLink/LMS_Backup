"""
Database configuration: SQLAlchemy engine, session factory, and get_db dependency.
"""
import logging
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

# Hardcoded IPs for Neon DBs to bypass DNS issues on user's system
NEON_HOSTS = {
    "ep-flat-tooth-a11scmlm-pooler.ap-southeast-1.aws.neon.tech": "52.220.170.93",
    "ep-little-rice-a1tsjfwk-pooler.ap-southeast-1.aws.neon.tech": "13.229.137.240" # Resolved in previous step
}

def get_connect_args(url: str) -> dict:
    args = {"connect_timeout": 10}
    for host, ip in NEON_HOSTS.items():
        if host in url:
            args["hostaddr"] = ip
            break
    return args

# Neon/serverless-friendly: recycle connections, fail fast on connect
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_pre_ping=True,
    pool_recycle=300,  # 5 min; Neon closes idle connections
    connect_args=get_connect_args(settings.DATABASE_URL),
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Dependency that yields a DB session. Usage: db: Session = Depends(get_db)."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
