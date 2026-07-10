"""
Analytics aggregation service — background pre-computation of dashboards.
"""

from __future__ import annotations

import uuid
from collections import Counter
from datetime import UTC, date, datetime, timedelta

import structlog
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.analytics_aggregate import AnalyticsAggregate
from app.models.click import Click
from app.repositories.analytics_aggregate import AnalyticsAggregateRepository
from app.repositories.url import URLRepository
from app.services.cache import CacheService

logger = structlog.get_logger()


class AnalyticsAggregationService:
    CACHE_NS = "analytics_agg"

    def __init__(self, session: AsyncSession, cache: CacheService) -> None:
        self._session = session
        self._repo = AnalyticsAggregateRepository(session)
        self._url_repo = URLRepository(session)
        self._cache = cache

    async def aggregate_url_for_date(
        self,
        url_id: uuid.UUID,
        target_date: date,
    ) -> AnalyticsAggregate:
        """Aggregate click data for a single URL on a given date."""
        day_start = datetime.combine(target_date, datetime.min.time(), tzinfo=UTC)
        day_end = day_start + timedelta(days=1)

        stmt = select(Click).where(
            Click.url_id == url_id,
            Click.clicked_at >= day_start,
            Click.clicked_at < day_end,
        )
        result = await self._session.execute(stmt)
        clicks = list(result.scalars().all())

        ip_hashes = [c.ip_hash for c in clicks]
        unique_ips = set(ip_hashes)
        ip_counts = Counter(ip_hashes)
        repeat_visitors = sum(1 for count in ip_counts.values() if count > 1)

        def count_field(field: str) -> dict:
            values = [getattr(c, field) or "Unknown" for c in clicks]
            counter = Counter(values)
            return dict(counter.most_common(20))

        hours = Counter(c.clicked_at.hour for c in clicks)
        weekdays = Counter(c.clicked_at.strftime("%A") for c in clicks)

        data = {
            "total_clicks": len(clicks),
            "unique_visitors": len(unique_ips),
            "repeat_visitors": repeat_visitors,
            "countries": count_field("country"),
            "cities": count_field("city"),
            "devices": count_field("device"),
            "browsers": count_field("browser"),
            "operating_systems": count_field("os"),
            "referrers": count_field("referrer"),
            "hours": {str(k): v for k, v in sorted(hours.items())},
            "weekdays": dict(weekdays),
            "traffic_sources": count_field("traffic_source"),
        }

        existing = await self._repo.get_by_url_and_date(url_id, target_date)
        if existing:
            agg = await self._repo.update(existing, **data)
        else:
            agg = await self._repo.create(url_id=url_id, aggregate_date=target_date, **data)

        await self._cache.set(
            self.CACHE_NS,
            f"{url_id}:{target_date.isoformat()}",
            data,
            ttl=86400,
        )
        return agg

    async def aggregate_all_urls(self, target_date: date | None = None) -> int:
        """Aggregate analytics for all URLs with clicks on target_date."""
        target_date = target_date or (datetime.now(UTC).date() - timedelta(days=1))
        day_start = datetime.combine(target_date, datetime.min.time(), tzinfo=UTC)
        day_end = day_start + timedelta(days=1)

        stmt = select(Click.url_id).where(
            Click.clicked_at >= day_start,
            Click.clicked_at < day_end,
        ).distinct()
        result = await self._session.execute(stmt)
        url_ids = [row[0] for row in result.all()]

        count = 0
        for url_id in url_ids:
            await self.aggregate_url_for_date(url_id, target_date)
            count += 1

        await logger.ainfo("analytics_aggregation_complete", date=str(target_date), urls=count)
        return count

    async def get_aggregated_dashboard(
        self,
        url_id: uuid.UUID,
        *,
        days: int = 30,
    ) -> dict:
        """Return pre-aggregated analytics for dashboard display."""
        cache_key = f"dashboard:{url_id}:{days}"
        cached = await self._cache.get(self.CACHE_NS, cache_key)
        if cached:
            return cached

        aggregates = await self._repo.get_range(url_id, days=days)
        if not aggregates:
            return {"aggregates": [], "totals": {}}

        totals = {
            "total_clicks": sum(a.total_clicks for a in aggregates),
            "unique_visitors": sum(a.unique_visitors for a in aggregates),
            "repeat_visitors": sum(a.repeat_visitors for a in aggregates),
        }

        # Merge top-level breakdowns
        merged: dict[str, Counter] = {
            "countries": Counter(),
            "devices": Counter(),
            "browsers": Counter(),
        }
        time_series = []
        for agg in aggregates:
            time_series.append({
                "date": agg.aggregate_date.isoformat(),
                "clicks": agg.total_clicks,
            })
            for country, count in (agg.countries or {}).items():
                merged["countries"][country] += count
            for device, count in (agg.devices or {}).items():
                merged["devices"][device] += count
            for browser, count in (agg.browsers or {}).items():
                merged["browsers"][browser] += count

        dashboard = {
            "time_series": time_series,
            "totals": totals,
            "top_countries": dict(merged["countries"].most_common(10)),
            "top_devices": dict(merged["devices"].most_common(10)),
            "top_browsers": dict(merged["browsers"].most_common(10)),
            "aggregates": [
                {
                    "date": a.aggregate_date.isoformat(),
                    "total_clicks": a.total_clicks,
                    "unique_visitors": a.unique_visitors,
                }
                for a in aggregates
            ],
        }

        await self._cache.set(self.CACHE_NS, cache_key, dashboard, ttl=3600)
        return dashboard

    async def get_trending_links(self, *, limit: int = 10) -> list[dict]:
        """Return trending links by recent click velocity."""
        yesterday = datetime.now(UTC).date() - timedelta(days=1)
        week_ago = yesterday - timedelta(days=7)

        stmt = (
            select(
                Click.url_id,
                func.count(Click.id).label("recent_clicks"),
            )
            .where(Click.clicked_at >= datetime.combine(week_ago, datetime.min.time(), tzinfo=UTC))
            .group_by(Click.url_id)
            .order_by(func.count(Click.id).desc())
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        trending = []
        for url_id, recent_clicks in result.all():
            url = await self._url_repo.get_by_id(url_id)
            if url and not url.is_deleted:
                trending.append({
                    "short_code": url.short_code,
                    "original_url": url.original_url,
                    "recent_clicks": recent_clicks,
                    "total_clicks": url.total_clicks,
                })
        return trending
