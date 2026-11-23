"""Centralised error types and handlers. Every error response has the shape
{"error": {"code": str, "message": str, "details": [{"field": str | None, "message": str}]}}.
"""

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("lablink")


class AppError(Exception):
    status_code = 400
    code = "bad_request"

    def __init__(self, message: str, *, code: str | None = None, field: str | None = None):
        super().__init__(message)
        self.message = message
        if code:
            self.code = code
        self.field = field


class NotFoundError(AppError):
    status_code = 404
    code = "not_found"


class ConflictError(AppError):
    """The request is valid but clashes with the current state (slot taken, wrong status...)."""

    status_code = 409
    code = "conflict"


class BusinessRuleError(AppError):
    """The request is well-formed but breaks a booking rule (date window, deadline...)."""

    status_code = 422
    code = "validation_error"


class DatabaseError(AppError):
    """The database is unreachable, not configured or returned an unexpected error."""

    status_code = 503
    code = "database_unavailable"


def _error(status: int, code: str, message: str, details: list[dict] | None = None) -> JSONResponse:
    return JSONResponse(
        status_code=status,
        content={"error": {"code": code, "message": message, "details": details or []}},
    )


async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
    details = [{"field": exc.field, "message": exc.message}] if exc.field else []
    return _error(exc.status_code, exc.code, exc.message, details)


async def validation_error_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    details = [
        {"field": ".".join(str(p) for p in err.get("loc", [])[1:]) or None, "message": err.get("msg", "Invalid value")}
        for err in exc.errors()
    ]
    return _error(422, "validation_error", "The request contains invalid data.", details)


async def http_error_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
    codes = {404: "not_found", 405: "method_not_allowed"}
    return _error(exc.status_code, codes.get(exc.status_code, "http_error"), str(exc.detail))


async def unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error on %s %s", request.method, request.url.path, exc_info=exc)
    return _error(500, "internal_error", "Something went wrong on the server. Please try again.")


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppError, app_error_handler)
    app.add_exception_handler(RequestValidationError, validation_error_handler)
    app.add_exception_handler(StarletteHTTPException, http_error_handler)
    app.add_exception_handler(Exception, unhandled_error_handler)
