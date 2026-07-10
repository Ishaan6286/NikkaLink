"""AI-generated URL summary ORM model."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

PROMPT_VERSION = "v1.0"


class URLSummary(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "url_summaries"

    url_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("urls.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    key_points: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(500)), nullable=True
    )
    reading_time_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    language: Mapped[str | None] = mapped_column(String(16), nullable=True)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    prompt_version: Mapped[str] = mapped_column(
        String(20), default=PROMPT_VERSION, nullable=False
    )

    url: Mapped["URL"] = relationship("URL", back_populates="ai_summary")  # noqa: F821
