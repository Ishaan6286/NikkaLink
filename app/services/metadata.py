"""
Metadata service — fetch, cache, and persist link preview data.
"""

from __future__ import annotations

import re
import uuid
from datetime import UTC, datetime
from html import unescape
from urllib.parse import urljoin, urlparse

import httpx
import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import NotFoundError, ValidationError
from app.models.metadata import URLMetadata
from app.repositories.metadata import MetadataRepository
from app.repositories.url import URLRepository
from app.services.cache import CacheService
from app.utils.url_safety import validate_external_url

logger = structlog.get_logger()

OG_TAG_RE = re.compile(
    r'<meta[^>]+(?:property|name)=["\'](og:[^"\']+|twitter:[^"\']+|description)["\'][^>]+content=["\']([^"\']+)["\']',
    re.IGNORECASE,
)
TITLE_RE = re.compile(r"<title[^>]*>([^<]+)</title>", re.IGNORECASE)
LINK_ICON_RE = re.compile(
    r'<link[^>]+rel=["\'](?:shortcut )?icon["\'][^>]+href=["\']([^"\']+)["\']',
    re.IGNORECASE,
)
LANG_RE = re.compile(r'<html[^>]+lang=["\']([^"\']+)["\']', re.IGNORECASE)
CANONICAL_RE = re.compile(
    r'<link[^>]+rel=["\'"]canonical["\'"][^>]+href=["\']([^"\']+)["\']',
    re.IGNORECASE,
)


class MetadataService:
    CACHE_NS = "metadata"
    CACHE_TTL = 86400  # 24 hours for Redis; DB is permanent

    def __init__(self, session: AsyncSession, cache: CacheService) -> None:
        self._session = session
        self._repo = MetadataRepository(session)
        self._url_repo = URLRepository(session)
        self._cache = cache
        self._settings = get_settings()

    def _parse_html(self, html: str, base_url: str) -> dict[str, str | None]:
        title_match = TITLE_RE.search(html)
        title = unescape(title_match.group(1).strip()) if title_match else None

        og: dict[str, str] = {}
        for match in OG_TAG_RE.finditer(html):
            prop, content = match.group(1).lower(), unescape(match.group(2).strip())
            og[prop] = content

        icon_match = LINK_ICON_RE.search(html)
        favicon = urljoin(base_url, icon_match.group(1)) if icon_match else None
        if not favicon:
            parsed = urlparse(base_url)
            favicon = f"{parsed.scheme}://{parsed.netloc}/favicon.ico"

        lang_match = LANG_RE.search(html)
        language = lang_match.group(1) if lang_match else None

        canonical_match = CANONICAL_RE.search(html)
        canonical = urljoin(base_url, canonical_match.group(1)) if canonical_match else base_url

        return {
            "title": og.get("og:title") or title,
            "description": og.get("og:description") or og.get("description"),
            "site_name": og.get("og:site_name") or urlparse(base_url).hostname,
            "og_image_url": og.get("og:image"),
            "favicon_url": favicon,
            "language": language,
            "canonical_url": canonical,
        }

    async def _fetch_remote(self, url: str) -> tuple[dict[str, str | None], str | None, str | None]:
        safe_url = validate_external_url(url)
        timeout = httpx.Timeout(10.0, connect=5.0)
        headers = {
            "User-Agent": "NikkaLink-MetadataBot/1.0 (+https://nikkalink.vercel.app)",
            "Accept": "text/html,application/xhtml+xml",
        }
        async with httpx.AsyncClient(
            follow_redirects=True,
            max_redirects=5,
            timeout=timeout,
        ) as client:
            response = await client.get(safe_url, headers=headers)
            content_type = response.headers.get("content-type", "").split(";")[0].strip()
            if "text/html" not in content_type and "application/xhtml" not in content_type:
                return {
                    "title": None,
                    "description": None,
                    "site_name": urlparse(safe_url).hostname,
                    "og_image_url": None,
                    "favicon_url": None,
                    "language": None,
                    "canonical_url": safe_url,
                }, content_type, None

            html = response.text[:500_000]  # Cap HTML size
            parsed = self._parse_html(html, str(response.url))
            return parsed, content_type, None

    async def fetch_and_store(
        self,
        url_id: uuid.UUID,
        original_url: str,
        *,
        force_refresh: bool = False,
    ) -> URLMetadata:
        """Fetch metadata for a URL and persist permanently."""
        existing = await self._repo.get_by_url_id(url_id)
        if existing and existing.fetched_at and not force_refresh:
            return existing

        cache_key = f"url:{url_id}"
        if not force_refresh:
            cached = await self._cache.get(self.CACHE_NS, cache_key)
            if cached:
                return await self._upsert_metadata(url_id, cached)

        try:
            parsed, content_type, _ = await self._fetch_remote(original_url)
            data = {
                **parsed,
                "content_type": content_type,
                "fetched_at": datetime.now(UTC).isoformat(),
                "fetch_error": None,
            }
        except (ValidationError, httpx.HTTPError) as exc:
            data = {
                "canonical_url": original_url,
                "title": None,
                "description": None,
                "site_name": urlparse(original_url).hostname,
                "og_image_url": None,
                "favicon_url": None,
                "language": None,
                "content_type": None,
                "fetched_at": datetime.now(UTC).isoformat(),
                "fetch_error": str(exc),
            }
            await logger.awarning("metadata_fetch_failed", url_id=str(url_id), error=str(exc))

        meta = await self._upsert_metadata(url_id, data)
        await self._cache.set(self.CACHE_NS, cache_key, data, ttl=self.CACHE_TTL)
        return meta

    async def _upsert_metadata(self, url_id: uuid.UUID, data: dict) -> URLMetadata:
        existing = await self._repo.get_by_url_id(url_id)
        fetched_at = data.get("fetched_at")
        if isinstance(fetched_at, str):
            fetched_at = datetime.fromisoformat(fetched_at)

        fields = {
            "canonical_url": data.get("canonical_url"),
            "title": data.get("title"),
            "description": data.get("description"),
            "site_name": data.get("site_name"),
            "og_image_url": data.get("og_image_url"),
            "favicon_url": data.get("favicon_url"),
            "language": data.get("language"),
            "content_type": data.get("content_type"),
            "fetched_at": fetched_at,
            "fetch_error": data.get("fetch_error"),
        }

        if existing:
            return await self._repo.update(existing, **fields)

        return await self._repo.create(url_id=url_id, **fields)

    async def get_metadata(self, url_id: uuid.UUID) -> URLMetadata:
        meta = await self._repo.get_by_url_id(url_id)
        if meta is None:
            raise NotFoundError("Metadata", str(url_id))
        return meta

    async def get_metadata_by_short_code(self, short_code: str) -> URLMetadata:
        url = await self._url_repo.get_by_short_code(short_code)
        if url is None:
            raise NotFoundError("URL", short_code)
        meta = await self._repo.get_by_url_id(url.id)
        if meta is None:
            raise NotFoundError("Metadata", short_code)
        return meta

    async def preview_url(self, url: str) -> dict:
        """Preview metadata for a URL without persisting (used before shortening)."""
        cache_key = f"preview:{url}"
        cached = await self._cache.get(self.CACHE_NS, cache_key)
        if cached:
            return cached

        parsed, content_type, _ = await self._fetch_remote(url)
        result = {**parsed, "content_type": content_type}
        await self._cache.set(self.CACHE_NS, cache_key, result, ttl=3600)
        return result
