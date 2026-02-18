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

# Neon/serverless-friendly: recycle connections, fail fast on connect
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_pre_ping=True,
    pool_recycle=300,  # 5 min; Neon closes idle connections
    connect_args={"connect_timeout": 10},  # fail fast if DB unreachable (e.g. Neon)
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
