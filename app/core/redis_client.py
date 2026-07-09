"""
Redis connection lifecycle with Upstash support and graceful degradation.

Resolves the Redis URL from environment (explicit REDIS_URL or Upstash REST
credentials converted to a TLS Redis protocol URL). The cache and rate limiter
use the standard Redis protocol via redis-py — not the Upstash REST HTTP API —
because they rely on pipelines, sorted sets, and SCAN.
"""

from __future__ import annotations

from urllib.parse import urlparse

import redis.asyncio as redis
import structlog

from app.core.config import get_settings

logger = structlog.get_logger()

_redis: redis.Redis | None = None
_redis_available: bool = False


async def init_redis() -> None:
    """Connect to Redis if configured; log a warning and continue on failure."""
    global _redis, _redis_available

    settings = get_settings()
    url = settings.resolved_redis_url

    if not url:
        await logger.awarning(
            "redis_not_configured",
            message="Redis URL not resolved; caching and rate limiting disabled",
        )
        _redis = None
        _redis_available = False
        return

    try:
        client = redis.from_url(url, decode_responses=True)
        await client.ping()
        _redis = client
        _redis_available = True
        await logger.ainfo(
            "redis_connected",
            host=urlparse(url).hostname,
        )
    except Exception as e:
        _redis = None
        _redis_available = False
        await logger.awarning(
            "redis_connection_failed",
            error=str(e),
            message="Application will run without Redis",
        )


async def get_redis() -> redis.Redis | None:
    """Return the shared Redis client, or None when unavailable."""
    return _redis


def is_redis_available() -> bool:
    """Whether Redis connected successfully during startup."""
    return _redis_available


async def close_redis() -> None:
    """Close the Redis connection pool on shutdown."""
    global _redis, _redis_available
    if _redis is not None:
        await _redis.close()
        _redis = None
        _redis_available = False
