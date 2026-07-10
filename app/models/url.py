"""
URL ORM model with soft delete and tagging support.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class URL(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "urls"

    short_code: Mapped[str] = mapped_column(
        String(32),
        unique=True,
        nullable=False,
        index=True,
    )
    original_url: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    custom_alias: Mapped[str | None] = mapped_column(
        String(32),
        unique=True,
        nullable=True,
    )
    owner_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
    )
    tags: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(50)),
        nullable=True,
        default=list,
    )
    total_clicks: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    # Link notes & organization
    note_title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    private_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    color_label: Mapped[str | None] = mapped_column(String(20), nullable=True)
    normalized_url: Mapped[str | None] = mapped_column(Text, nullable=True, index=True)

    # Relationships
    owner: Mapped["User | None"] = relationship(  # noqa: F821
        "User",
        back_populates="urls",
    )
    clicks: Mapped[list["Click"]] = relationship(  # noqa: F821
        "Click",
        back_populates="url",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    link_metadata: Mapped["URLMetadata | None"] = relationship(  # noqa: F821
        "URLMetadata",
        back_populates="url",
        uselist=False,
        cascade="all, delete-orphan",
    )
    health: Mapped["URLHealth | None"] = relationship(  # noqa: F821
        "URLHealth",
        back_populates="url",
        uselist=False,
        cascade="all, delete-orphan",
    )
    ai_summary: Mapped["URLSummary | None"] = relationship(  # noqa: F821
        "URLSummary",
        back_populates="url",
        uselist=False,
        cascade="all, delete-orphan",
    )
    collection_items: Mapped[list["CollectionItem"]] = relationship(  # noqa: F821
        "CollectionItem",
        back_populates="url",
        cascade="all, delete-orphan",
    )

    @property
    def is_expired(self) -> bool:
        """Check if the URL has expired."""
        if self.expires_at is None:
            return False
        from datetime import UTC

        return datetime.now(UTC) > self.expires_at

    @property
    def is_deleted(self) -> bool:
        """Check if the URL has been soft-deleted."""
        return self.deleted_at is not None

    def __repr__(self) -> str:
        return f"<URL id={self.id} short_code={self.short_code}>"
