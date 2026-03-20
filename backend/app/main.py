"""
Main FastAPI Application Entry Point.
Non-functional refactor: clean architecture, error handling, logging; no API/schema changes.
"""
import logging
import os
from contextlib import asynccontextmanager
from typing import List

_MAIN_FILE = os.path.abspath(__file__)

from fastapi import FastAPI, Request
from fastapi.exceptions import HTTPException as FastAPIHTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from sqlalchemy import text
from sqlalchemy.exc import OperationalError as SQLAlchemyOperationalError

from app.core.config import settings
from app.core.database import Base, engine
from app.core.migrations import run_all_migrations
from app.core.logging_config import configure_logging
from app.models import FAQKnowledgeBase, RFQRequest, User, AuditLog  # noqa: F401 - register models for create_all

# Import Routers
from app.modules.organization import routes as organization_routes
from app.modules.files import routes as file_routes
from app.modules.calendar import router as calendar_router
from app.modules.test_management import routes as test_management_routes
from app.modules.projects import routes as projects_routes
from app.modules.inventory import routes as inventory_routes
from app.modules.quality_assurance import routes as quality_assurance_routes

# New Routers
from app.modules.rfqs.routes import router as rfq_router
from app.modules.estimations.routes import router as estimation_router
from app.modules.certification.routes import router as certifications_router
from app.modules.audits_section.routes import router as audit_router
from app.modules.ncrs.routes import router as ncr_router
from app.modules.samples.routes import router as samples_router
from app.modules.trf.routes import router as trfs_router
from app.modules.reports.routes import router as reports_router
from app.modules.document.routes import router as documents_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    """
    configure_logging(level="DEBUG" if settings.DEBUG else "INFO")
    # Startup
    logging.getLogger("app").info("Starting up LMS Backend...")
    if len(settings.JWT_SECRET_KEY) < 32:
        logging.getLogger("app").warning(
            "JWT_SECRET_KEY is %d bytes; use at least 32 for HS256. Set JWT_SECRET_KEY in .env and restart.",
            len(settings.JWT_SECRET_KEY),
        )

    # Create upload directories if they don't exist
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(os.path.join(settings.UPLOAD_DIR, "logos"), exist_ok=True)
    os.makedirs(os.path.join(settings.UPLOAD_DIR, "documents"), exist_ok=True)
    
    # Enable pgvector before creating tables that use it
    from app.services.faq_loader import ensure_pgvector_extension
    ensure_pgvector_extension()
    # Create database tables (in production, use Alembic migrations)
    Base.metadata.create_all(bind=engine)

    # Run custom standard migrations (our .py scripts)
    try:
        run_all_migrations()
    except Exception as e:
        logging.getLogger("app").error(f"Startup migrations failed: {e}")

    # Verify database connectivity (fail fast if DB unreachable, e.g. Neon)
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logging.getLogger("app").info("Database connection OK.")
    except Exception as e:
        logging.getLogger("app").critical(
            "Database connection failed. Check DATABASE_URL and network (e.g. Neon). Error: %s",
            e,
        )
        raise

    # Lab recommendation engine (optional: requires LAB_ENGINE_DATABASE_URL)
    # Native service under app.services.lab_recommendation_engine; no plugins.
    if getattr(settings, "LAB_ENGINE_DATABASE_URL", "") and settings.LAB_ENGINE_DATABASE_URL.strip():
        try:
            from app.services.lab_recommendation_engine import LabRecommendationEngine
            app.state.lab_engine = LabRecommendationEngine(
                settings.LAB_ENGINE_DATABASE_URL.strip(),
            )
            logging.getLogger("app").info(
                "Lab recommendation engine initialized (native service).",
            )
        except Exception as e:
            logging.getLogger("app").warning("Lab recommendation engine not loaded: %s", e)
            app.state.lab_engine = None
    else:
        app.state.lab_engine = None

    # Chatbot: load FAQ knowledge base into pgvector if empty
    try:
        from app.services.faq_loader import run_faq_startup
        await run_faq_startup()
    except Exception as e:
        logging.getLogger("app").warning("FAQ startup warning: %s", e)

    logging.getLogger("app").info("Startup complete.")

    yield

    # Shutdown
    logging.getLogger("app").info("Shutting down LMS Backend...")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Backend API for Laboratory Management System",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

def _standard_error_response(
    status_code: int,
    error: str,
    details: List[str] | None = None,
) -> JSONResponse:
    """Return consistent error JSON for unhandled exceptions."""
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "error": error,
            "details": details or [],
        },
    )


@app.exception_handler(SQLAlchemyOperationalError)
async def db_connection_exception_handler(request: Request, exc: SQLAlchemyOperationalError) -> JSONResponse:
    """Return 503 when DB is unreachable (e.g. Neon timeout, network)."""
    logging.getLogger("app").warning(
        "Database connection failed | path=%s | error=%s",
        request.url.path,
        str(exc.orig) if getattr(exc, "orig", None) else str(exc),
    )
    return _standard_error_response(
        status_code=503,
        error="Database temporarily unavailable.",
        details=["Connection to the database timed out or failed. If using Neon, the project may be suspended—check the Neon dashboard and try again."],
    )


@app.exception_handler(FastAPIHTTPException)
async def http_exception_handler(request: Request, exc: FastAPIHTTPException) -> JSONResponse:
    """Standard error format for 401/403 and other HTTP errors."""
    detail = exc.detail
    if isinstance(detail, list):
        details = [str(d) for d in detail]
    elif isinstance(detail, str):
        details = [detail] if detail else []
    else:
        details = [str(detail)]
    error_msg = "Unauthorized" if exc.status_code == 401 else ("Forbidden" if exc.status_code == 403 else (detail if isinstance(detail, str) else "Error"))
    return _standard_error_response(status_code=exc.status_code, error=error_msg, details=details)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Catch unhandled exceptions; return standard error format.
    HTTPException is handled by FastAPI and returns detail as-is (contract preserved).
    """
    logging.getLogger("app").exception(
        "Unhandled exception | path=%s | method=%s",
        request.url.path,
        request.method,
        exc_info=exc,
    )
    return _standard_error_response(
        status_code=500,
        error="An unexpected error occurred.",
        details=[str(exc)] if settings.DEBUG else [],
    )


# Auth: require JWT for /api/v1/* except /api/v1/auth
from app.middleware.auth_middleware import AuthRequiredMiddleware
app.add_middleware(AuthRequiredMiddleware)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    # Strict-Transport-Security (optional, but good for production)
    # response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174", 
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        *settings.cors_origins_list  # Include origins from .env
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploads
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include routers (auth routes are registered directly on app above)
app.include_router(
    organization_routes.router,
    prefix="/api/v1/organizations",
    tags=["Organizations"]
)

app.include_router(
    file_routes.router,
    prefix="/api/v1/files",
    tags=["Files"]
)

app.include_router(
    calendar_router,
    prefix="/api/v1",
    tags=["Calendar"]
)

app.include_router(
    test_management_routes.router,
    prefix="/api/v1",
    tags=["Test Management"]
)

app.include_router(
    projects_routes.router,
    prefix="/api/v1",
    tags=["Projects & Customers"]
)

app.include_router(
    inventory_routes.router,
    prefix="/api/v1",
    tags=["Inventory Management"]
)

app.include_router(
    quality_assurance_routes.router,
    prefix="/api/v1",
    tags=["Quality Assurance"]
)

# New Modules
app.include_router(rfq_router, prefix="/api/v1", tags=["RFQs"])
app.include_router(estimation_router, prefix="/api/v1", tags=["Estimations"])
app.include_router(certifications_router, prefix="/api/v1", tags=["Certifications"])
app.include_router(audit_router, prefix="/api/v1", tags=["Audits Section"])
app.include_router(ncr_router, prefix="/api/v1", tags=["NCRS"])
app.include_router(samples_router, prefix="/api/v1", tags=["Samples"])
app.include_router(trfs_router, prefix="/api/v1", tags=["TRFs"])
app.include_router(reports_router, prefix="/api/v1", tags=["Reports"])
app.include_router(documents_router, prefix="/api/v1", tags=["Documents (Extended)"])

from app.modules.labs.routes import router as labs_router
app.include_router(labs_router, prefix="/api/v1", tags=["Labs / Recommendations"])

from app.modules.scope_management.routes import router as scope_management_router
app.include_router(scope_management_router, prefix="/api/v1/scope-management", tags=["Scope Management"])

from app.routes.chatbot import router as chatbot_router
app.include_router(chatbot_router, prefix="/api/v1/chat", tags=["Chatbot"])

from app.routes.rfq import router as rfq_upload_router
app.include_router(rfq_upload_router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint. If you see auth_available true, the app on 8000 is this LMS backend."""
    return {
        "message": "Welcome to LMS Backend API",
        "version": settings.APP_VERSION,
        "docs": "/api/docs",
        "auth_available": True,
        "main_loaded_from": _MAIN_FILE,
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION
    }


# Auth endpoints: defined here with decorators so they are always registered (no router)
@app.get("/api/v1/auth/health")
def auth_health():
    return {"status": "ok", "service": "auth"}


from app.core.database import get_db
from app.dependencies.auth_dependency import get_current_user, get_current_user_optional
from app.routes.auth import (
    login as _auth_login,
    signup as _auth_signup,
    me as _auth_me,
    LoginRequest,
    LoginResponse,
    SignupRequest,
    SignupResponse,
    MeResponse,
    get_users as _auth_get_users,
    delete_user_route as _auth_delete_user,
    request_password_reset as _auth_request_reset,
    perform_password_reset as _auth_reset_password,
    ResetRequest,
    PasswordReset,
    verify_mfa as _auth_verify_mfa,
    VerifyMFARequest,
    update_profile as _auth_update_profile,
    change_password as _auth_change_password,
    UpdateProfileRequest,
    ChangePasswordRequest,
)
from app.models.user_model import User
from fastapi import Depends
from sqlalchemy.orm import Session
from typing import List


@app.post("/api/v1/auth/login", response_model=LoginResponse)
def auth_login(body: LoginRequest, request: Request, db: Session = Depends(get_db)):
    return _auth_login(body, request, db)


@app.post("/api/v1/auth/signup", response_model=SignupResponse)
def auth_signup_route(body: SignupRequest, request: Request, db: Session = Depends(get_db), current_user: User | None = Depends(get_current_user_optional)):
    return _auth_signup(body, request, db, current_user)


@app.get("/api/v1/auth/me", response_model=MeResponse)
def auth_me_route(current_user: User = Depends(get_current_user)):
    return _auth_me(current_user)


@app.put("/api/v1/auth/profile", response_model=MeResponse)
def auth_update_profile_route(body: UpdateProfileRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return _auth_update_profile(body, db, current_user)


@app.post("/api/v1/auth/change-password")
def auth_change_password_route(body: ChangePasswordRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return _auth_change_password(body, db, current_user)


@app.get("/api/v1/auth/users", response_model=List[MeResponse])
def auth_users_route(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return all users for Admin Dashboard."""
    return _auth_get_users(current_user, db)


@app.delete("/api/v1/auth/users/{user_id}")
def auth_delete_user_route(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Delete a user account for Admin Dashboard."""
    return _auth_delete_user(user_id, db, current_user)


@app.post("/api/v1/auth/request-reset")
def auth_request_reset_route(body: ResetRequest, db: Session = Depends(get_db)):
    """Generate a reset token and send email."""
    return _auth_request_reset(body, db)


@app.post("/api/v1/auth/reset-password")
def auth_reset_password_route(body: PasswordReset, db: Session = Depends(get_db)):
    """Verify token and set new password."""
    return _auth_reset_password(body, db)


@app.post("/api/v1/auth/verify-mfa", response_model=LoginResponse)
def auth_verify_mfa_route(body: VerifyMFARequest, db: Session = Depends(get_db)):
    """Verify the 6-digit MFA code and issue the final access token."""
    return _auth_verify_mfa(body, db)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
