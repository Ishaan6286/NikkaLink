"""
Automatic cache invalidation triggered by domain events.
"""

from __future__ import annotations

import structlog

from app.services.cache import CacheService

logger = structlog.get_logger()


class CacheInvalidationService:
  NAMESPACES_ON_LINK_CHANGE = [
    ("metadata", "url_id"),
    ("health", "url_id"),
    ("analytics", "url_id"),
    ("analytics_agg", "dashboard"),
    ("summary", "url_id"),
    ("search", "short_code"),
  ]

  def __init__(self, cache: CacheService) -> None:
    self._cache = cache

  async def on_link_changed(self, payload: dict) -> None:
    url_id = payload.get("url_id")
    short_code = payload.get("short_code")
    owner_id = payload.get("owner_id")

    if url_id:
      await self._cache.delete("metadata", f"url:{url_id}")
      await self._cache.delete("health", url_id)
      await self._cache.delete("analytics", str(url_id))
      await self._cache.delete("summary", url_id)

    if short_code:
      await self._cache.delete("url", short_code)
      await self._cache.delete("search", short_code)

    if owner_id:
      await self._cache.invalidate_pattern(f"dashboard:user:{owner_id}*")

    await logger.ainfo(
      "cache_invalidated",
      url_id=url_id,
      short_code=short_code,
    )

  async def on_profile_updated(self, owner_id: str) -> None:
    await self._cache.delete("profile", owner_id)
    await self._cache.invalidate_pattern(f"profile:slug:*")

  async def on_analytics_updated(self, url_id: str) -> None:
    await self._cache.delete("analytics", str(url_id))
    await self._cache.invalidate_pattern(f"analytics_agg:dashboard:{url_id}*")
