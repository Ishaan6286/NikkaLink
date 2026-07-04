"""
Analytics / click-tracking Pydantic schemas.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel


class ClickResponse(BaseModel):
    """Single click event."""

    id: uuid.UUID
    ip_hash: str
    browser: str | None = None
    device: str | None = None
    os: str | None = None
    referrer: str | None = None
    country: str | None = None
    clicked_at: datetime

    model_config = {"from_attributes": True}


class BrowserStats(BaseModel):
    """Aggregated browser statistics."""

    browser: str
    count: int
    percentage: float


class DeviceStats(BaseModel):
    """Aggregated device statistics."""

    device: str
    count: int
    percentage: float


class OSStats(BaseModel):
    """Aggregated OS statistics."""

    os: str
    count: int
    percentage: float


class ReferrerStats(BaseModel):
    """Aggregated referrer statistics."""

    referrer: str
    count: int
    percentage: float


class TimeSeriesPoint(BaseModel):
    """Single point in a time series."""

    date: str
    clicks: int


class AnalyticsSummary(BaseModel):
    """Full analytics dashboard for a URL."""

    short_code: str
    original_url: str
    total_clicks: int
    unique_visitors: int
    browsers: list[BrowserStats]
    devices: list[DeviceStats]
    operating_systems: list[OSStats]
    referrers: list[ReferrerStats]
    time_series: list[TimeSeriesPoint]
    created_at: datetime
