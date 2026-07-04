"""
Click repository — data access for Click entities with aggregation queries.
"""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.click import Click
from app.repositories.base import BaseRepository


class ClickRepository(BaseRepository[Click]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Click, session)

    async def create_click(self, **kwargs: Any) -> Click:
        """Record a new click event."""
        return await self.create(**kwargs)

    async def get_by_url_id(
        self,
        url_id: uuid.UUID,
        *,
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[list[Click], int]:
        """Get paginated clicks for a specific URL."""
        filters = [Click.url_id == url_id]
        return await self.get_all(
            offset=offset,
            limit=limit,
            sort_by="clicked_at",
            sort_order="desc",
            filters=filters,
        )

    async def count_unique_visitors(self, url_id: uuid.UUID) -> int:
        """Count unique visitors by distinct IP hash."""
        stmt = (
            select(func.count(func.distinct(Click.ip_hash)))
            .where(Click.url_id == url_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar() or 0

    async def aggregate_by_field(
        self,
        url_id: uuid.UUID,
        field_name: str,
    ) -> list[dict[str, Any]]:
        """
        Aggregate click counts by a given field (browser, device, os, referrer).

        Returns list of {"value": <field_value>, "count": <int>}.
        """
        field = getattr(Click, field_name)
        stmt = (
            select(field, func.count().label("count"))
            .where(Click.url_id == url_id, field.isnot(None))
            .group_by(field)
            .order_by(func.count().desc())
            .limit(20)
        )
        result = await self.session.execute(stmt)
        rows = result.all()

        total = sum(row.count for row in rows)
        return [
            {
                "value": row[0] or "Unknown",
                "count": row.count,
                "percentage": round((row.count / total) * 100, 1) if total > 0 else 0,
            }
            for row in rows
        ]

    async def time_series(
        self,
        url_id: uuid.UUID,
        days: int = 30,
    ) -> list[dict[str, Any]]:
        """
        Get click counts per day for the last N days.

        Returns list of {"date": "YYYY-MM-DD", "clicks": <int>}.
        """
        stmt = (
            select(
                func.date(Click.clicked_at).label("date"),
                func.count().label("clicks"),
            )
            .where(
                Click.url_id == url_id,
                Click.clicked_at >= func.now() - text(f"interval '{days} days'"),
            )
            .group_by(func.date(Click.clicked_at))
            .order_by(func.date(Click.clicked_at))
        )
        result = await self.session.execute(stmt)
        return [
            {"date": str(row.date), "clicks": row.clicks}
            for row in result.all()
        ]
