"""Pre-aggregated analytics ORM model — populated by background workers."""

from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDMixin


class AnalyticsAggregate(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "analytics_aggregates"
    __table_args__ = (
        UniqueConstraint("url_id", "aggregate_date", name="uq_url_aggregate_date"),
    )

    url_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("urls.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    aggregate_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    total_clicks: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    unique_visitors: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    repeat_visitors: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    countries: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    cities: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    devices: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    browsers: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    operating_systems: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    referrers: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    hours: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    weekdays: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    traffic_sources: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
