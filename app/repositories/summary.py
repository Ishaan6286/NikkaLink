"""Summary repository."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.summary import URLSummary
from app.repositories.base import BaseRepository


class SummaryRepository(BaseRepository[URLSummary]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(URLSummary, session)

    async def get_by_url_id(self, url_id: uuid.UUID) -> URLSummary | None:
        stmt = select(URLSummary).where(URLSummary.url_id == url_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
