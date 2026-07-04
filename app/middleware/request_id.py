"""
Request ID middleware.

Generates a UUID4 X-Request-ID for every request if not provided
by the client, stores it in contextvars for structured logging,
and injects it into the response headers.
"""

from __future__ import annotations

import uuid
from contextvars import ContextVar

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

request_id_ctx: ContextVar[str] = ContextVar("request_id", default="")


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        # Use client-provided header or generate a new one
        rid = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request_id_ctx.set(rid)

        response = await call_next(request)
        response.headers["X-Request-ID"] = rid
        return response
