"""
Structured logging configuration for LMS backend.
Single approach: standard logging with consistent format.
Do not log sensitive data (tokens, credentials, full bodies with secrets).
"""
import logging
import sys
from typing import Any

from app.core.constants import LOG_DATE_FORMAT, LOG_FORMAT


def configure_logging(
    level: str = "INFO",
    format_string: str = LOG_FORMAT,
    date_fmt: str = LOG_DATE_FORMAT,
) -> None:
    """Configure root logger and common loggers with consistent format."""
    root = logging.getLogger()
    root.setLevel(getattr(logging, level.upper(), logging.INFO))
    if not root.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(root.level)
        formatter = logging.Formatter(format_string, datefmt=date_fmt)
        handler.setFormatter(formatter)
        root.addHandler(handler)
    # Reduce noise from third-party loggers (avoid dumping full request/response bodies)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("openai").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)


def log_rfq_upload_start(filename: str | None, size: int | None) -> None:
    """Structured log: RFQ upload started."""
    logger = logging.getLogger("app.rfq")
    logger.info("RFQ upload started | filename=%s | size_bytes=%s", filename, size)


def log_rfq_upload_success(request_id: Any, filename: str | None) -> None:
    """Structured log: RFQ upload succeeded."""
    logger = logging.getLogger("app.rfq")
    logger.info("RFQ upload success | request_id=%s | filename=%s", request_id, filename)


def log_rfq_upload_validation_failed(filename: str | None, error_count: int) -> None:
    """Structured log: RFQ validation failed (Incomplete)."""
    logger = logging.getLogger("app.rfq")
    logger.info("RFQ upload validation failed | filename=%s | error_count=%s", filename, error_count)


def log_rfq_upload_error(stage: str, message: str) -> None:
    """Structured log: RFQ upload error (parse or workflow)."""
    logger = logging.getLogger("app.rfq")
    logger.warning("RFQ upload error | stage=%s | message=%s", stage, message)


def log_chatbot_request(session_id: str | None, has_role: bool) -> None:
    """Structured log: Chatbot message received."""
    logger = logging.getLogger("app.chatbot")
    logger.info("Chatbot message | session_id=%s | has_role=%s", session_id, has_role)


def log_chatbot_success(session_id: str | None) -> None:
    """Structured log: Chatbot reply sent."""
    logger = logging.getLogger("app.chatbot")
    logger.info("Chatbot reply sent | session_id=%s", session_id)


def log_chatbot_failure(session_id: str | None, reason: str) -> None:
    """Structured log: Chatbot failure (no config or backend error)."""
    logger = logging.getLogger("app.chatbot")
    logger.warning("Chatbot failure | session_id=%s | reason=%s", session_id, reason)
