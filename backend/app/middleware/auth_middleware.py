"""
Middleware: require valid JWT for /api/v1/* except /api/v1/auth and /health.
Returns 401 with standard format if missing or invalid token.
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.core.security import decode_access_token


def _is_public_path(path: str) -> bool:
    if path == "/" or path == "/health":
        return True
    if path.startswith("/api/docs") or path.startswith("/api/redoc") or path.startswith("/api/openapi"):
        return True
    if path.startswith("/api/v1/auth"):
        return True
    if path.startswith("/api/v1/uploads"):
        return True
    return False


class AuthRequiredMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.scope.get("path", "")
        if request.method == "OPTIONS":
            return await call_next(request)
        if _is_public_path(path):
            return await call_next(request)
        if not path.startswith("/api/v1"):
            return await call_next(request)
        auth = request.headers.get("Authorization")
        if not auth or not auth.startswith("Bearer "):
            return JSONResponse(
                status_code=401,
                content={"success": False, "error": "Unauthorized", "details": ["Not authenticated"]},
                headers={"WWW-Authenticate": "Bearer"},
            )
        token = auth[7:].strip()
        payload = decode_access_token(token)
        if not payload:
            return JSONResponse(
                status_code=401,
                content={"success": False, "error": "Unauthorized", "details": ["Invalid or expired token"]},
                headers={"WWW-Authenticate": "Bearer"},
            )
        request.state.user_id = payload.get("sub")
        request.state.user_role = payload.get("role")
        request.state.user_email = payload.get("email")
        return await call_next(request)
