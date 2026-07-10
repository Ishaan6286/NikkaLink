"""Public profile service."""

from __future__ import annotations

import re
import uuid

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.models.url import URL
from app.models.user import User
from app.repositories.user import UserRepository

logger = structlog.get_logger()


class ProfileService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = UserRepository(session)
        self._session = session

    async def get_public_profile(self, slug: str) -> dict:
        stmt = select(User).where(
            User.profile_slug == slug,
            User.is_profile_public.is_(True),
            User.is_active.is_(True),
        )
        result = await self._session.execute(stmt)
        user = result.scalar_one_or_none()
        if user is None:
            raise NotFoundError("Profile", slug)

        pinned = await self._get_pinned_links(user.id)
        total_clicks = sum(u.total_clicks for u in pinned)

        return {
            "username": user.username,
            "profile_slug": user.profile_slug,
            "display_name": user.display_name or user.username,
            "bio": user.bio,
            "avatar_url": user.avatar_url,
            "social_links": user.social_links or {},
            "theme_config": user.theme_config or {},
            "pinned_links": pinned,
            "public_stats": {
                "total_links": len(pinned),
                "total_clicks": total_clicks,
            },
        }

    async def _get_pinned_links(self, owner_id: uuid.UUID) -> list[dict]:
        stmt = (
            select(URL)
            .where(
                URL.owner_id == owner_id,
                URL.is_pinned.is_(True),
                URL.deleted_at.is_(None),
                URL.is_active.is_(True),
            )
            .order_by(URL.created_at.desc())
            .limit(20)
        )
        result = await self._session.execute(stmt)
        urls = result.scalars().all()
        return [
            {
                "short_code": u.short_code,
                "original_url": u.original_url,
                "note_title": u.note_title,
                "total_clicks": u.total_clicks,
            }
            for u in urls
        ]

    async def update_profile(
        self,
        user_id: uuid.UUID,
        **fields,
    ) -> User:
        user = await self._repo.get_by_id(user_id)
        if user is None:
            raise NotFoundError("User", str(user_id))

        if "profile_slug" in fields and fields["profile_slug"]:
            slug = self._sanitize_slug(fields["profile_slug"])
            existing = await self._get_by_slug(slug)
            if existing and existing.id != user_id:
                raise ConflictError(f"Profile slug '{slug}' is already taken")
            fields["profile_slug"] = slug

        return await self._repo.update(user, **{k: v for k, v in fields.items() if v is not None})

    async def _get_by_slug(self, slug: str) -> User | None:
        stmt = select(User).where(User.profile_slug == slug)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    def _sanitize_slug(value: str) -> str:
        slug = re.sub(r"[^a-zA-Z0-9_-]", "-", value.lower()).strip("-")[:50]
        if len(slug) < 3:
            raise ConflictError("Profile slug must be at least 3 characters")
        return slug
