"""
Custom exception classes and FastAPI exception handlers.

All business-logic exceptions inherit from AppError, which carries
an HTTP status code and a machine-readable error code for API consumers.
"""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


# ── Base Exception ───────────────────────────────────────────────────────────


class AppError(Exception):
    """Base application error."""

    def __init__(
        self,
        message: str = "An unexpected error occurred",
        status_code: int = 500,
        error_code: str = "INTERNAL_ERROR",
        details: dict[str, Any] | None = None,
    ) -> None:
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)


# ── Specific Exceptions ─────────────────────────────────────────────────────


class NotFoundError(AppError):
    def __init__(self, resource: str = "Resource", identifier: str = "") -> None:
        detail = f"{resource} not found"
        if identifier:
            detail = f"{resource} '{identifier}' not found"
        super().__init__(
            message=detail,
            status_code=404,
            error_code="NOT_FOUND",
        )


class ConflictError(AppError):
    def __init__(self, message: str = "Resource already exists") -> None:
        super().__init__(
            message=message,
            status_code=409,
            error_code="CONFLICT",
        )


class AuthenticationError(AppError):
    def __init__(self, message: str = "Authentication failed") -> None:
        super().__init__(
            message=message,
            status_code=401,
            error_code="AUTHENTICATION_ERROR",
        )


class AuthorizationError(AppError):
    def __init__(self, message: str = "Not authorized to perform this action") -> None:
        super().__init__(
            message=message,
            status_code=403,
            error_code="AUTHORIZATION_ERROR",
        )


class ValidationError(AppError):
    def __init__(self, message: str = "Validation error", details: dict[str, Any] | None = None) -> None:
        super().__init__(
            message=message,
            status_code=422,
            error_code="VALIDATION_ERROR",
            details=details,
        )


class RateLimitError(AppError):
    def __init__(self, retry_after: int = 60) -> None:
        super().__init__(
            message="Rate limit exceeded. Please try again later.",
            status_code=429,
            error_code="RATE_LIMIT_EXCEEDED",
            details={"retry_after": retry_after},
        )
        self.retry_after = retry_after


class ExpiredURLError(AppError):
    def __init__(self, short_code: str = "") -> None:
        detail = "This URL has expired"
        if short_code:
            detail = f"URL '{short_code}' has expired"
        super().__init__(
            message=detail,
            status_code=410,
            error_code="URL_EXPIRED",
        )


# ── Exception Handlers ──────────────────────────────────────────────────────


def register_exception_handlers(app: FastAPI) -> None:
    """Register custom exception handlers on the FastAPI app."""

    @app.exception_handler(AppError)
    async def app_error_handler(_request: Request, exc: AppError) -> JSONResponse:
        content: dict[str, Any] = {
            "error": {
                "code": exc.error_code,
                "message": exc.message,
            }
        }
        if exc.details:
            content["error"]["details"] = exc.details

        headers: dict[str, str] = {}
        if isinstance(exc, RateLimitError):
            headers["Retry-After"] = str(exc.retry_after)

        return JSONResponse(
            status_code=exc.status_code,
            content=content,
            headers=headers,
        )

    @app.exception_handler(Exception)
    async def unhandled_error_handler(_request: Request, exc: Exception) -> JSONResponse:
        import structlog

        logger = structlog.get_logger()
        await logger.aerror("unhandled_exception", error=str(exc), exc_info=True)

        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An unexpected error occurred",
                }
            },
        )
