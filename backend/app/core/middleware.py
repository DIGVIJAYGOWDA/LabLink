import logging
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import Settings

logger = logging.getLogger("lablink.request")

# Sent on every API response: the API only returns JSON, so nothing may be framed, sniffed or cached.
SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cache-Control": "no-store",
}


DOCS_PATHS = {"/docs", "/redoc", "/docs/oauth2-redirect"}


def _payload_too_large(limit: int) -> JSONResponse:
    message = f"Request body is too large (limit {limit // 1024} KB)."
    return JSONResponse(
        status_code=413,
        content={"error": {"code": "payload_too_large", "message": message, "details": []}},
    )


def register_middleware(app: FastAPI, settings: Settings) -> None:
    # Starlette runs the last-added middleware first, so the order below is:
    # logging + security headers -> CORS -> body size limit -> routes.
    # Keeping the size check inside CORS means a 413 still reaches the browser with CORS headers.
    limit = settings.max_request_body_bytes

    @app.middleware("http")
    async def limit_body_size(request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length is not None:
            try:
                too_large = int(content_length) > limit
            except ValueError:
                too_large = True
            if too_large:
                return _payload_too_large(limit)
        return await call_next(request)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        # Development: allow any local port (Vite moves to 5174, 5175... when 5173 is busy).
        # Production: only the origins listed in CORS_ORIGINS.
        allow_origin_regex=None if settings.is_production else r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type"],
    )

    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start) * 1000
        response.headers["X-Process-Time-Ms"] = f"{elapsed_ms:.1f}"
        is_docs_page = request.url.path in DOCS_PATHS  # Swagger UI needs its own scripts (dev only)
        for name, value in SECURITY_HEADERS.items():
            if not (is_docs_page and name == "Content-Security-Policy"):
                response.headers.setdefault(name, value)
        if settings.is_production:
            response.headers.setdefault("Strict-Transport-Security", "max-age=63072000; includeSubDomains")
        logger.info("%s %s -> %s (%.1f ms)", request.method, request.url.path, response.status_code, elapsed_ms)
        return response
