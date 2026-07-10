"""Metadata repository."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.metadata import URLMetadata
from app.repositories.base import BaseRepository


class MetadataRepository(BaseRepository[URLMetadata]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(URLMetadata, session)

    async def get_by_url_id(self, url_id: uuid.UUID) -> URLMetadata | None:
        stmt = select(URLMetadata).where(URLMetadata.url_id == url_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_canonical(self, canonical_url: str) -> URLMetadata | None:
        stmt = select(URLMetadata).where(URLMetadata.canonical_url == canonical_url)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
