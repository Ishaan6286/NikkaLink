"""
URL repository — data access for URL entities with search,
soft delete, and bulk operations.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import or_, select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.url import URL
from app.repositories.base import BaseRepository


class URLRepository(BaseRepository[URL]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(URL, session)

    async def get_by_short_code(self, short_code: str) -> URL | None:
        """Find a URL by its short code (excludes soft-deleted)."""
        stmt = select(URL).where(
            URL.short_code == short_code,
            URL.deleted_at.is_(None),
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_custom_alias(self, alias: str) -> URL | None:
        """Find a URL by custom alias."""
        stmt = select(URL).where(
            URL.custom_alias == alias,
            URL.deleted_at.is_(None),
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def short_code_exists(self, short_code: str) -> bool:
        """Check if a short code already exists."""
        stmt = select(func.count()).select_from(URL).where(URL.short_code == short_code)
        result = await self.session.execute(stmt)
        return (result.scalar() or 0) > 0

    async def get_by_owner(
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
    ) -> tuple[list[URL], int]:
        """Get paginated URLs for a specific owner with optional search/filter."""
        filters: list[Any] = [
            URL.owner_id == owner_id,
            URL.deleted_at.is_(None),
        ]

        if query:
            search_term = f"%{query}%"
            filters.append(
                or_(
                    URL.original_url.ilike(search_term),
                    URL.short_code.ilike(search_term),
                    URL.tags.any(query.lower()),
                )
            )

        if tag:
            filters.append(URL.tags.any(tag.lower()))

        if is_active is not None:
            filters.append(URL.is_active == is_active)

        return await self.get_all(
            offset=offset,
            limit=limit,
            sort_by=sort_by,
            sort_order=sort_order,
            filters=filters,
        )

    async def soft_delete(self, url: URL) -> URL:
        """Soft-delete a URL by setting deleted_at."""
        return await self.update(url, deleted_at=datetime.now(UTC), is_active=False)

    async def increment_clicks(self, url: URL) -> URL:
        """Increment the total click counter."""
        url.total_clicks = (url.total_clicks or 0) + 1
        await self.session.flush()
        await self.session.refresh(url)
        return url

    async def bulk_create(self, urls_data: list[dict[str, Any]]) -> list[URL]:
        """Create multiple URLs in a single flush."""
        created: list[URL] = []
        for data in urls_data:
            instance = URL(**data)
            self.session.add(instance)
            created.append(instance)
        await self.session.flush()
        for url in created:
            await self.session.refresh(url)
        return created
