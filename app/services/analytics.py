"""
Analytics service — click tracking, user-agent parsing, and aggregation.
"""

from __future__ import annotations

import hashlib
import uuid
from datetime import datetime

import structlog
from sqlalchemy.ext.asyncio import AsyncSession
from user_agents import parse as parse_ua

from app.models.click import Click
from app.repositories.click import ClickRepository
from app.schemas.analytics import (
    AnalyticsSummary,
    BrowserStats,
    ClickResponse,
    DeviceStats,
    OSStats,
    ReferrerStats,
    TimeSeriesPoint,
)
from app.services.cache import CacheService

logger = structlog.get_logger()


class AnalyticsService:
    """Click tracking, aggregation, and analytics dashboards."""

    CACHE_NS = "analytics"

    def __init__(self, session: AsyncSession, cache: CacheService) -> None:
        self._repo = ClickRepository(session)
        self._cache = cache

    @staticmethod
    def _hash_ip(ip: str) -> str:
        """SHA-256 hash an IP address for privacy."""
        return hashlib.sha256(ip.encode("utf-8")).hexdigest()

    @staticmethod
    def _parse_user_agent(ua_string: str | None) -> dict[str, str | None]:
        """Extract browser, device, and OS from a user-agent string."""
        if not ua_string:
            return {"browser": None, "device": None, "os": None}

        ua = parse_ua(ua_string)
        return {
            "browser": f"{ua.browser.family} {ua.browser.version_string}".strip(),
            "device": ua.device.family if ua.device.family != "Other" else "Desktop",
            "os": f"{ua.os.family} {ua.os.version_string}".strip(),
        }

    async def track_click(
        self,
        url_id: uuid.UUID,
        ip: str,
        user_agent: str | None = None,
        referrer: str | None = None,
    ) -> Click:
        """
        Record a click event with parsed user-agent information.
        Invalidates analytics cache for the associated URL.
        """
        ip_hash = self._hash_ip(ip)
        ua_data = self._parse_user_agent(user_agent)

        click = await self._repo.create_click(
            url_id=url_id,
            ip_hash=ip_hash,
            user_agent=user_agent,
            browser=ua_data["browser"],
            device=ua_data["device"],
            os=ua_data["os"],
            referrer=referrer,
        )

        # Invalidate analytics cache for this URL
        await self._cache.delete(self.CACHE_NS, str(url_id))

        return click

    async def get_summary(
        self,
        url_id: uuid.UUID,
        short_code: str,
        original_url: str,
        total_clicks: int,
        created_at: datetime,
    ) -> AnalyticsSummary:
        """
        Build a full analytics dashboard for a URL.
        Uses cache when available.
        """
        # Try cache
        cache_key = f"summary:{url_id}"
        cached = await self._cache.get(self.CACHE_NS, cache_key)
        if cached:
            return AnalyticsSummary(**cached)

        # Aggregate from DB
        unique_visitors = await self._repo.count_unique_visitors(url_id)

        browser_data = await self._repo.aggregate_by_field(url_id, "browser")
        device_data = await self._repo.aggregate_by_field(url_id, "device")
        os_data = await self._repo.aggregate_by_field(url_id, "os")
        referrer_data = await self._repo.aggregate_by_field(url_id, "referrer")
        ts_data = await self._repo.time_series(url_id, days=30)

        summary = AnalyticsSummary(
            short_code=short_code,
            original_url=original_url,
            total_clicks=total_clicks,
            unique_visitors=unique_visitors,
            browsers=[
                BrowserStats(browser=d["value"], count=d["count"], percentage=d["percentage"])
                for d in browser_data
            ],
            devices=[
                DeviceStats(device=d["value"], count=d["count"], percentage=d["percentage"])
                for d in device_data
            ],
            operating_systems=[
                OSStats(os=d["value"], count=d["count"], percentage=d["percentage"])
                for d in os_data
            ],
            referrers=[
                ReferrerStats(referrer=d["value"], count=d["count"], percentage=d["percentage"])
                for d in referrer_data
            ],
            time_series=[
                TimeSeriesPoint(date=d["date"], clicks=d["clicks"])
                for d in ts_data
            ],
            created_at=created_at,
        )

        # Cache for next request
        await self._cache.set(self.CACHE_NS, cache_key, summary.model_dump(mode="json"))

        return summary

    async def get_clicks(
        self,
        url_id: uuid.UUID,
        *,
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[list[ClickResponse], int]:
        """Get paginated click events for a URL."""
        clicks, total = await self._repo.get_by_url_id(url_id, offset=offset, limit=limit)
        responses = [
            ClickResponse(
                id=c.id,
                ip_hash=c.ip_hash,
                browser=c.browser,
                device=c.device,
                os=c.os,
                referrer=c.referrer,
                country=c.country,
                clicked_at=c.clicked_at,
            )
            for c in clicks
        ]
        return responses, total

    async def get_time_series(
        self,
        url_id: uuid.UUID,
        days: int = 30,
    ) -> list[TimeSeriesPoint]:
        """Get time series click data."""
        ts_data = await self._repo.time_series(url_id, days=days)
        return [
            TimeSeriesPoint(date=d["date"], clicks=d["clicks"])
            for d in ts_data
        ]
