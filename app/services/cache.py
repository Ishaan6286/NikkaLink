"""
Redis-backed cache service with JSON serialization, TTL, and namespace prefixing.
"""

from __future__ import annotations

import json
from typing import Any

import redis.asyncio as redis
import structlog

from app.core.config import get_settings

logger = structlog.get_logger()


class CacheService:
    """Async Redis cache with JSON serialization and key namespacing."""

    PREFIX = "urlshort"

    def __init__(self, redis_client: redis.Redis | None) -> None:
        self._redis = redis_client
        self._settings = get_settings()

    def _is_available(self) -> bool:
        return self._redis is not None

    def _make_key(self, namespace: str, key: str) -> str:
        """Build a namespaced Redis key."""
        return f"{self.PREFIX}:{namespace}:{key}"

    async def get(self, namespace: str, key: str) -> Any | None:
        """Get a value from cache, returning None on miss."""
        if not self._is_available():
            return None
        full_key = self._make_key(namespace, key)
        try:
            data = await self._redis.get(full_key)
            if data is None:
                return None
            return json.loads(data)
        except Exception as e:
            await logger.awarning("cache_get_error", key=full_key, error=str(e))
            return None

    async def set(
        self,
        namespace: str,
        key: str,
        value: Any,
        ttl: int | None = None,
    ) -> None:
        """Set a value in cache with optional TTL (defaults to config TTL)."""
        if not self._is_available():
            return
        full_key = self._make_key(namespace, key)
        ttl = ttl or self._settings.REDIS_CACHE_TTL
        try:
            serialized = json.dumps(value, default=str)
            await self._redis.set(full_key, serialized, ex=ttl)
        except Exception as e:
            await logger.awarning("cache_set_error", key=full_key, error=str(e))

    async def delete(self, namespace: str, key: str) -> None:
        """Delete a specific key from cache."""
        if not self._is_available():
            return
        full_key = self._make_key(namespace, key)
        try:
            await self._redis.delete(full_key)
        except Exception as e:
            await logger.awarning("cache_delete_error", key=full_key, error=str(e))

    async def invalidate_pattern(self, pattern: str) -> None:
        """Delete all keys matching a pattern (use sparingly)."""
        if not self._is_available():
            return
        full_pattern = f"{self.PREFIX}:{pattern}"
        try:
            cursor = 0
            while True:
                cursor, keys = await self._redis.scan(
                    cursor=cursor,
                    match=full_pattern,
                    count=100,
                )
                if keys:
                    await self._redis.delete(*keys)
                if cursor == 0:
                    break
        except Exception as e:
            await logger.awarning("cache_invalidate_error", pattern=full_pattern, error=str(e))

    async def ping(self) -> bool:
        """Check Redis connectivity."""
        if not self._is_available():
            return False
        try:
            return await self._redis.ping()
        except Exception:
            return False
