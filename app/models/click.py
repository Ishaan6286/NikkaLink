"""
Click / analytics ORM model.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDMixin


class Click(UUIDMixin, Base):
    __tablename__ = "clicks"

    url_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("urls.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    ip_hash: Mapped[str] = mapped_column(
        String(64),  # SHA-256 hex digest
        nullable=False,
    )
    user_agent: Mapped[str | None] = mapped_column(
        String(512),
        nullable=True,
    )
    browser: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    device: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    os: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    referrer: Mapped[str | None] = mapped_column(
        String(2048),
        nullable=True,
    )
    country: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    clicked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    # Relationships
    url: Mapped["URL"] = relationship(  # noqa: F821
        "URL",
        back_populates="clicks",
    )

    def __repr__(self) -> str:
        return f"<Click id={self.id} url_id={self.url_id}>"
