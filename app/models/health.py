"""URL health monitoring ORM model."""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class HealthStatus(StrEnum):
    HEALTHY = "healthy"
    WARNING = "warning"
    BROKEN = "broken"
    UNKNOWN = "unknown"


class URLHealth(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "url_health"

    url_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("urls.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        String(20),
        default=HealthStatus.UNKNOWN,
        nullable=False,
        index=True,
    )
    last_checked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    failure_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    response_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    availability_pct: Mapped[float] = mapped_column(Float, default=100.0, nullable=False)
    ssl_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    check_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    success_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    http_status_code: Mapped[int | None] = mapped_column(Integer, nullable=True)

    url: Mapped["URL"] = relationship("URL", back_populates="health")  # noqa: F821
