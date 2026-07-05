"""
URL service — shortening, validation, bulk ops, QR, and cache integration.
"""

from __future__ import annotations

import uuid
from typing import Any

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import ConflictError, ExpiredURLError, NotFoundError, ValidationError
from app.models.url import URL
from app.repositories.url import URLRepository
from app.schemas.url import URLCreate, URLResponse, URLUpdate
from app.services.cache import CacheService
from app.utils.shortcode import generate_short_code

logger = structlog.get_logger()


class URLService:
    """Business logic for URL shortening operations."""

    CACHE_NS = "url"

    def __init__(self, session: AsyncSession, cache: CacheService) -> None:
        self._repo = URLRepository(session)
        self._cache = cache
        self._settings = get_settings()

    def _build_short_url(self, short_code: str) -> str:
        """Build the full shortened URL."""
        base = self._settings.public_app_url
        return f"{base}/{short_code}"

    def _to_response(self, url: URL) -> URLResponse:
        """Convert a URL model to response schema."""
        return URLResponse(
            id=url.id,
            short_code=url.short_code,
            short_url=self._build_short_url(url.short_code),
            original_url=url.original_url,
            custom_alias=url.custom_alias,
            owner_id=url.owner_id,
            expires_at=url.expires_at,
            is_active=url.is_active,
            tags=url.tags,
            total_clicks=url.total_clicks,
            created_at=url.created_at,
            updated_at=url.updated_at,
        )

    async def create_short_url(
        self,
        data: URLCreate,
        owner_id: uuid.UUID | None,
        public_app_url: str | None = None,
    ) -> URLResponse:
        """
        Create a new shortened URL.

        Generates a unique short code or uses the custom alias.
        Caches the result for fast redirect lookups.
        """
        short_code: str

        if data.custom_alias:
            # Check alias uniqueness
            existing = await self._repo.get_by_short_code(data.custom_alias)
            if existing:
                raise ConflictError(f"Alias '{data.custom_alias}' is already taken")
            existing_alias = await self._repo.get_by_custom_alias(data.custom_alias)
            if existing_alias:
                raise ConflictError(f"Alias '{data.custom_alias}' is already taken")
            short_code = data.custom_alias
        else:
            # Generate unique short code with collision detection
            short_code = await self._generate_unique_code()

        url = await self._repo.create(
            short_code=short_code,
            original_url=data.original_url,
            custom_alias=data.custom_alias,
            owner_id=owner_id,
            expires_at=data.expires_at,
            tags=data.tags or [],
        )

        # Cache for redirect lookups
        await self._cache.set(self.CACHE_NS, short_code, {
            "original_url": url.original_url,
            "is_active": url.is_active,
            "expires_at": str(url.expires_at) if url.expires_at else None,
            "url_id": str(url.id),
        })

        response = self._to_response(url)
        if public_app_url:
            response.short_url = f"{public_app_url.rstrip('/')}/{short_code}"
        await logger.ainfo(
            "url_created",
            short_code=short_code,
            owner_id=str(owner_id),
        )
        return response

    async def get_url_by_short_code(self, short_code: str) -> URLResponse:
        """Get URL details by short code."""
        url = await self._repo.get_by_short_code(short_code)
        if url is None:
            raise NotFoundError("URL", short_code)
        return self._to_response(url)

    async def get_original_url(self, short_code: str) -> tuple[str, uuid.UUID]:
        """
        Resolve a short code to the original URL (for redirect).
        Uses cache-first strategy.

        Returns:
            Tuple of (original_url, url_id).
        """
        # Try cache first
        cached = await self._cache.get(self.CACHE_NS, short_code)
        if cached:
            if not cached.get("is_active", True):
                raise NotFoundError("URL", short_code)
            expires = cached.get("expires_at")
            if expires and expires != "None":
                from datetime import UTC, datetime

                exp_dt = datetime.fromisoformat(expires)
                if datetime.now(UTC) > exp_dt:
                    raise ExpiredURLError(short_code)
            return cached["original_url"], uuid.UUID(cached["url_id"])

        # Cache miss — hit DB
        url = await self._repo.get_by_short_code(short_code)
        if url is None:
            raise NotFoundError("URL", short_code)

        if url.is_deleted:
            raise NotFoundError("URL", short_code)

        if not url.is_active:
            raise NotFoundError("URL", short_code)

        if url.is_expired:
            raise ExpiredURLError(short_code)

        # Populate cache for next lookup
        await self._cache.set(self.CACHE_NS, short_code, {
            "original_url": url.original_url,
            "is_active": url.is_active,
            "expires_at": str(url.expires_at) if url.expires_at else None,
            "url_id": str(url.id),
        })

        return url.original_url, url.id

    async def get_user_urls(
        self,
        owner_id: uuid.UUID,
        *,
        offset: int = 0,
        limit: int = 20,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        query: str | None = None,
        tag: str | None = None,
        is_active: bool | None = None,
    ) -> tuple[list[URLResponse], int]:
        """Get paginated URLs for a user with optional search/filter."""
        urls, total = await self._repo.get_by_owner(
            owner_id,
            offset=offset,
            limit=limit,
            sort_by=sort_by,
            sort_order=sort_order,
            query=query,
            tag=tag,
            is_active=is_active,
        )
        return [self._to_response(u) for u in urls], total

    async def update_url(
        self,
        short_code: str,
        data: URLUpdate,
        owner_id: uuid.UUID,
    ) -> URLResponse:
        """Update a URL's properties."""
        url = await self._repo.get_by_short_code(short_code)
        if url is None:
            raise NotFoundError("URL", short_code)

        if url.owner_id != owner_id:
            from app.core.exceptions import AuthorizationError
            raise AuthorizationError("You do not own this URL")

        update_data = data.model_dump(exclude_unset=True)
        if not update_data:
            raise ValidationError("No fields to update")

        url = await self._repo.update(url, **update_data)

        # Invalidate cache
        await self._cache.delete(self.CACHE_NS, short_code)

        return self._to_response(url)

    async def soft_delete_url(
        self,
        short_code: str,
        owner_id: uuid.UUID,
    ) -> None:
        """Soft-delete a URL."""
        url = await self._repo.get_by_short_code(short_code)
        if url is None:
            raise NotFoundError("URL", short_code)

        if url.owner_id != owner_id:
            from app.core.exceptions import AuthorizationError
            raise AuthorizationError("You do not own this URL")

        await self._repo.soft_delete(url)

        # Invalidate cache
        await self._cache.delete(self.CACHE_NS, short_code)

        await logger.ainfo("url_deleted", short_code=short_code, owner_id=str(owner_id))

    async def bulk_create(
        self,
        urls_data: list[URLCreate],
        owner_id: uuid.UUID | None,
    ) -> tuple[list[URLResponse], list[dict]]:
        """
        Create multiple URLs at once.

        Returns a tuple of (created URLs, errors).
        """
        created: list[URLResponse] = []
        errors: list[dict] = []

        for i, data in enumerate(urls_data):
            try:
                response = await self.create_short_url(data, owner_id)
                created.append(response)
            except Exception as e:
                errors.append({
                    "index": i,
                    "url": data.original_url,
                    "error": str(e),
                })

        return created, errors

    async def increment_clicks(self, short_code: str) -> None:
        """Increment click counter for a URL."""
        url = await self._repo.get_by_short_code(short_code)
        if url:
            await self._repo.increment_clicks(url)

    async def _generate_unique_code(self, max_retries: int = 10) -> str:
        """Generate a unique short code with collision detection."""
        for _ in range(max_retries):
            code = generate_short_code(self._settings.SHORT_CODE_LENGTH)
            if not await self._repo.short_code_exists(code):
                return code
        raise ValidationError("Failed to generate unique short code after retries")
