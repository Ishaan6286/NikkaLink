"""URL metadata ORM model — OpenGraph / page preview data."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class URLMetadata(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "url_metadata"

    url_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("urls.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    canonical_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    title: Mapped[str | None] = mapped_column(String(512), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    site_name: Mapped[str | None] = mapped_column(String(256), nullable=True)
    og_image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    favicon_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    language: Mapped[str | None] = mapped_column(String(16), nullable=True)
    content_type: Mapped[str | None] = mapped_column(String(128), nullable=True)
    fetched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    fetch_error: Mapped[str | None] = mapped_column(Text, nullable=True)

    url: Mapped["URL"] = relationship("URL", back_populates="link_metadata")  # noqa: F821
