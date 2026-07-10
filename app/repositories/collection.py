"""Collection repository."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.collection import Collection, CollectionItem
from app.repositories.base import BaseRepository


class CollectionRepository(BaseRepository[Collection]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Collection, session)

    async def get_by_owner(
        self,
        owner_id: uuid.UUID,
        *,
        parent_id: uuid.UUID | None = None,
    ) -> list[Collection]:
        filters = [Collection.owner_id == owner_id]
        if parent_id is None:
            filters.append(Collection.parent_id.is_(None))
        else:
            filters.append(Collection.parent_id == parent_id)

        stmt = (
            select(Collection)
            .where(*filters)
            .order_by(Collection.sort_order, Collection.name)
            .options(selectinload(Collection.children))
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_with_items(self, collection_id: uuid.UUID) -> Collection | None:
        stmt = (
            select(Collection)
            .where(Collection.id == collection_id)
            .options(
                selectinload(Collection.items).selectinload(CollectionItem.url),
                selectinload(Collection.children),
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()


class CollectionItemRepository(BaseRepository[CollectionItem]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(CollectionItem, session)

    async def get_by_collection_and_url(
        self,
        collection_id: uuid.UUID,
        url_id: uuid.UUID,
    ) -> CollectionItem | None:
        stmt = select(CollectionItem).where(
            CollectionItem.collection_id == collection_id,
            CollectionItem.url_id == url_id,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
