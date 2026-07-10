"""
Intelligence service — duplicate detection and smart alias suggestions.
"""

from __future__ import annotations

import re
import uuid

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.url import URL
from app.repositories.url import URLRepository
from app.schemas.url import URLResponse
from app.services.cache import CacheService
from app.utils.shortcode import generate_short_code
from app.utils.url_normalize import normalize_url

logger = structlog.get_logger()


class IntelligenceService:
    CACHE_NS = "intelligence"

    def __init__(self, session: AsyncSession, cache: CacheService) -> None:
        self._session = session
        self._repo = URLRepository(session)
        self._cache = cache

    async def find_duplicate(
        self,
        original_url: str,
        owner_id: uuid.UUID | None,
    ) -> URL | None:
        """Find an existing URL with the same normalized destination."""
        normalized = normalize_url(original_url)
        filters = [
            URL.normalized_url == normalized,
            URL.deleted_at.is_(None),
        ]
        if owner_id:
            filters.append(URL.owner_id == owner_id)

        stmt = select(URL).where(*filters).limit(1)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def check_duplicate(
        self,
        original_url: str,
        owner_id: uuid.UUID | None,
        *,
        build_short_url: str,
    ) -> dict | None:
        """Return duplicate info if found, else None."""
        existing = await self.find_duplicate(original_url, owner_id)
        if existing is None:
            return None

        return {
            "is_duplicate": True,
            "existing": {
                "id": str(existing.id),
                "short_code": existing.short_code,
                "short_url": f"{build_short_url.rstrip('/')}/{existing.short_code}",
                "original_url": existing.original_url,
                "total_clicks": existing.total_clicks,
                "created_at": existing.created_at.isoformat(),
            },
        }

    async def suggest_aliases(
        self,
        original_url: str,
        owner_id: uuid.UUID | None,
        *,
        title: str | None = None,
        count: int = 5,
    ) -> list[str]:
        """Generate unique alias suggestions."""
        cache_key = f"aliases:{normalize_url(original_url)}"
        cached = await self._cache.get(self.CACHE_NS, cache_key)
        if cached:
            return cached[:count]

        domain = re.sub(r"^www\.", "", original_url.split("//")[-1].split("/")[0].split(".")[0])
        slug_words: list[str] = []

        if title:
            slug_words = re.findall(r"[a-zA-Z0-9]{3,}", title.lower())[:4]

        path_slug = ""
        path_part = original_url.rstrip("/").split("/")[-1]
        if path_part and "." not in path_part:
            path_slug = re.sub(r"[^a-zA-Z0-9_-]", "-", path_part.lower())[:20]

        candidates: list[str] = []
        if path_slug:
            candidates.append(path_slug)
        if slug_words:
            candidates.append("-".join(slug_words[:2]))
            candidates.append(slug_words[0])
        candidates.append(domain)
        if slug_words and domain:
            candidates.append(f"{domain}-{slug_words[0]}")

        # Add generated codes as fallback suggestions
        for _ in range(3):
            candidates.append(generate_short_code(6))

        unique: list[str] = []
        seen: set[str] = set()
        for raw in candidates:
            alias = re.sub(r"[^a-zA-Z0-9_-]", "-", raw).strip("-")[:30]
            if len(alias) < 3 or alias in seen:
                continue
            if await self._repo.short_code_exists(alias):
                continue
            if await self._repo.get_by_custom_alias(alias):
                continue
            seen.add(alias)
            unique.append(alias)
            if len(unique) >= count:
                break

        await self._cache.set(self.CACHE_NS, cache_key, unique, ttl=300)
        return unique
