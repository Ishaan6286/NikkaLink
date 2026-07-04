"""
Structured request/response logging middleware using structlog.

Logs method, path, status code, duration, request ID, and correlation ID
for every HTTP request processed.
"""

from __future__ import annotations

import time

import structlog
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.middleware.correlation_id import correlation_id_ctx
from app.middleware.request_id import request_id_ctx

logger = structlog.get_logger()


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log every request with structured context."""

    # Paths to suppress from logging (noisy health checks)
    SUPPRESS_PATHS = {"/health", "/ready"}

    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        if request.url.path in self.SUPPRESS_PATHS:
            return await call_next(request)

        start_time = time.perf_counter()

        # Build log context
        log_ctx = {
            "method": request.method,
            "path": request.url.path,
            "query": str(request.query_params) if request.query_params else None,
            "client_ip": request.client.host if request.client else "unknown",
            "request_id": request_id_ctx.get(""),
            "correlation_id": correlation_id_ctx.get(""),
        }

        try:
            response = await call_next(request)
            duration_ms = (time.perf_counter() - start_time) * 1000

            await logger.ainfo(
                "http_request",
                **log_ctx,
                status_code=response.status_code,
                duration_ms=round(duration_ms, 2),
            )
            return response

        except Exception as exc:
            duration_ms = (time.perf_counter() - start_time) * 1000
            await logger.aerror(
                "http_request_error",
                **log_ctx,
                duration_ms=round(duration_ms, 2),
                error=str(exc),
                exc_info=True,
            )
            raise
