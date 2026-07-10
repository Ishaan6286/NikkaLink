"""
User ORM model.
"""

from __future__ import annotations

import uuid

from sqlalchemy import Boolean, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class User(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(
        String(320),
        unique=True,
        nullable=False,
        index=True,
    )
    username: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )
    hashed_password: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    # Public profile fields
    display_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    profile_slug: Mapped[str | None] = mapped_column(
        String(50), unique=True, nullable=True, index=True
    )
    is_profile_public: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    theme_config: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    social_links: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Relationships
    urls: Mapped[list["URL"]] = relationship(  # noqa: F821
        "URL",
        back_populates="owner",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    collections: Mapped[list["Collection"]] = relationship(  # noqa: F821
        "Collection",
        back_populates="owner",
        lazy="selectin",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email}>"
