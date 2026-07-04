"""
Correlation ID middleware.

Propagates or generates an X-Correlation-ID header for tracing
requests across services. Stored in contextvars for structured logging.
"""

from __future__ import annotations

import uuid
from contextvars import ContextVar

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

correlation_id_ctx: ContextVar[str] = ContextVar("correlation_id", default="")


class CorrelationIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        cid = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
        correlation_id_ctx.set(cid)

        response = await call_next(request)
        response.headers["X-Correlation-ID"] = cid
        return response
