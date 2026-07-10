"""Analytics aggregate repository."""

from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.analytics_aggregate import AnalyticsAggregate
from app.repositories.base import BaseRepository


class AnalyticsAggregateRepository(BaseRepository[AnalyticsAggregate]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(AnalyticsAggregate, session)

    async def get_by_url_and_date(
        self,
        url_id: uuid.UUID,
        aggregate_date: date,
    ) -> AnalyticsAggregate | None:
        stmt = select(AnalyticsAggregate).where(
            AnalyticsAggregate.url_id == url_id,
            AnalyticsAggregate.aggregate_date == aggregate_date,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_range(
        self,
        url_id: uuid.UUID,
        *,
        days: int = 30,
    ) -> list[AnalyticsAggregate]:
        from datetime import UTC, datetime, timedelta

        start = datetime.now(UTC).date() - timedelta(days=days)
        stmt = (
            select(AnalyticsAggregate)
            .where(
                AnalyticsAggregate.url_id == url_id,
                AnalyticsAggregate.aggregate_date >= start,
            )
            .order_by(AnalyticsAggregate.aggregate_date)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
