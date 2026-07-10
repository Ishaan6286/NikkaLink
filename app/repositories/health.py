"""Health monitoring repository."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.health import URLHealth
from app.repositories.base import BaseRepository


class HealthRepository(BaseRepository[URLHealth]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(URLHealth, session)

    async def get_by_url_id(self, url_id: uuid.UUID) -> URLHealth | None:
        stmt = select(URLHealth).where(URLHealth.url_id == url_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_due_for_check(
        self,
        *,
        active_interval_hours: int = 6,
        inactive_interval_hours: int = 24,
        limit: int = 100,
    ) -> list[URLHealth]:
        """Return health records due for periodic checking."""
        now = datetime.now(UTC)
        active_cutoff = now - timedelta(hours=active_interval_hours)
        inactive_cutoff = now - timedelta(hours=inactive_interval_hours)

        from app.models.url import URL

        stmt = (
            select(URLHealth)
            .join(URL, URLHealth.url_id == URL.id)
            .where(
                URL.deleted_at.is_(None),
                URL.is_active.is_(True),
                (
                    (URLHealth.last_checked_at.is_(None))
                    | (
                        (URL.is_active.is_(True))
                        & (URLHealth.last_checked_at < active_cutoff)
                    )
                    | (
                        (URL.is_active.is_(False))
                        & (URLHealth.last_checked_at < inactive_cutoff)
                    )
                ),
            )
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
