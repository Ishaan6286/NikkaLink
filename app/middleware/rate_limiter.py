"""
Redis-backed sliding window rate limiter middleware.

Applies different rate limits for anonymous and authenticated users.
Returns 429 Too Many Requests with Retry-After header when exceeded.
"""

from __future__ import annotations

import time

import redis.asyncio as redis
import structlog
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.core.config import get_settings

logger = structlog.get_logger()


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """Sliding window rate limiter backed by Redis sorted sets."""

    # Paths exempt from rate limiting
    EXEMPT_PATHS = {"/health", "/ready", "/docs", "/redoc", "/openapi.json"}

    def __init__(self, app, redis_client: redis.Redis) -> None:  # type: ignore[override]
        super().__init__(app)
        self._redis = redis_client
        self._settings = get_settings()

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request, respecting X-Forwarded-For."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def _get_rate_limit_key(self, request: Request) -> tuple[str, int]:
        """
        Determine the rate limit key and max requests.

        Returns:
            Tuple of (redis_key, max_requests).
        """
        # Check if user is authenticated via Authorization header
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            # Extract user identity from token (simplified — full decode in deps)
            try:
                from app.core.security import decode_token

                token = auth_header.split(" ", 1)[1]
                payload = decode_token(token)
                user_id = payload.get("sub", "unknown")
                return f"ratelimit:auth:{user_id}", self._settings.RATE_LIMIT_AUTHENTICATED
            except Exception:
                pass

        ip = self._get_client_ip(request)
        return f"ratelimit:anon:{ip}", self._settings.RATE_LIMIT_ANONYMOUS

    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        # Skip rate limiting for exempt paths
        if request.url.path in self.EXEMPT_PATHS:
            return await call_next(request)

        key, max_requests = self._get_rate_limit_key(request)
        window = self._settings.RATE_LIMIT_WINDOW_SECONDS
        now = time.time()
        window_start = now - window

        try:
            pipe = self._redis.pipeline()
            # Remove expired entries
            pipe.zremrangebyscore(key, 0, window_start)
            # Add current request
            pipe.zadd(key, {str(now): now})
            # Count requests in window
            pipe.zcard(key)
            # Set TTL on key
            pipe.expire(key, window)
            results = await pipe.execute()

            request_count = results[2]

            if request_count > max_requests:
                retry_after = int(window - (now - window_start))
                await logger.awarning(
                    "rate_limit_exceeded",
                    key=key,
                    count=request_count,
                    limit=max_requests,
                )
                return JSONResponse(
                    status_code=429,
                    content={
                        "error": {
                            "code": "RATE_LIMIT_EXCEEDED",
                            "message": "Rate limit exceeded. Please try again later.",
                            "details": {"retry_after": retry_after},
                        }
                    },
                    headers={"Retry-After": str(retry_after)},
                )

            response = await call_next(request)
            # Add rate limit headers
            response.headers["X-RateLimit-Limit"] = str(max_requests)
            response.headers["X-RateLimit-Remaining"] = str(max(0, max_requests - request_count))
            response.headers["X-RateLimit-Reset"] = str(int(now + window))
            return response

        except redis.RedisError as e:
            # If Redis is down, allow the request through (fail-open)
            await logger.awarning("rate_limiter_redis_error", error=str(e))
            return await call_next(request)
