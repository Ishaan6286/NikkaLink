"""Collection service — folders, nested collections, bulk operations."""

from __future__ import annotations

import uuid

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthorizationError, ConflictError, NotFoundError
from app.models.collection import Collection, CollectionItem
from app.repositories.collection import CollectionItemRepository, CollectionRepository
from app.repositories.url import URLRepository

logger = structlog.get_logger()


class CollectionService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = CollectionRepository(session)
        self._item_repo = CollectionItemRepository(session)
        self._url_repo = URLRepository(session)

    async def list_collections(
        self,
        owner_id: uuid.UUID,
        *,
        parent_id: uuid.UUID | None = None,
    ) -> list[Collection]:
        return await self._repo.get_by_owner(owner_id, parent_id=parent_id)

    async def create_collection(
        self,
        owner_id: uuid.UUID,
        *,
        name: str,
        description: str | None = None,
        parent_id: uuid.UUID | None = None,
        color: str | None = None,
    ) -> Collection:
        if parent_id:
            parent = await self._repo.get_by_id(parent_id)
            if parent is None or parent.owner_id != owner_id:
                raise NotFoundError("Collection", str(parent_id))

        return await self._repo.create(
            owner_id=owner_id,
            name=name,
            description=description,
            parent_id=parent_id,
            color=color,
        )

    async def get_collection(
        self,
        collection_id: uuid.UUID,
        owner_id: uuid.UUID,
    ) -> Collection:
        collection = await self._repo.get_with_items(collection_id)
        if collection is None:
            raise NotFoundError("Collection", str(collection_id))
        if collection.owner_id != owner_id:
            raise AuthorizationError("You do not own this collection")
        return collection

    async def update_collection(
        self,
        collection_id: uuid.UUID,
        owner_id: uuid.UUID,
        **fields,
    ) -> Collection:
        collection = await self.get_collection(collection_id, owner_id)
        return await self._repo.update(collection, **{k: v for k, v in fields.items() if v is not None})

    async def delete_collection(
        self,
        collection_id: uuid.UUID,
        owner_id: uuid.UUID,
    ) -> None:
        collection = await self.get_collection(collection_id, owner_id)
        await self._repo.delete(collection)

    async def add_url(
        self,
        collection_id: uuid.UUID,
        url_id: uuid.UUID,
        owner_id: uuid.UUID,
        *,
        sort_order: int = 0,
    ) -> CollectionItem:
        await self.get_collection(collection_id, owner_id)
        url = await self._url_repo.get_by_id(url_id)
        if url is None or url.owner_id != owner_id:
            raise NotFoundError("URL", str(url_id))

        existing = await self._item_repo.get_by_collection_and_url(collection_id, url_id)
        if existing:
            raise ConflictError("URL is already in this collection")

        return await self._item_repo.create(
            collection_id=collection_id,
            url_id=url_id,
            sort_order=sort_order,
        )

    async def remove_url(
        self,
        collection_id: uuid.UUID,
        url_id: uuid.UUID,
        owner_id: uuid.UUID,
    ) -> None:
        await self.get_collection(collection_id, owner_id)
        item = await self._item_repo.get_by_collection_and_url(collection_id, url_id)
        if item is None:
            raise NotFoundError("CollectionItem", f"{collection_id}/{url_id}")
        await self._item_repo.delete(item)

    async def bulk_move(
        self,
        url_ids: list[uuid.UUID],
        target_collection_id: uuid.UUID,
        owner_id: uuid.UUID,
    ) -> int:
        await self.get_collection(target_collection_id, owner_id)
        moved = 0
        for i, url_id in enumerate(url_ids):
            try:
                await self.add_url(target_collection_id, url_id, owner_id, sort_order=i)
                moved += 1
            except ConflictError:
                continue
        return moved

    async def reorder_items(
        self,
        collection_id: uuid.UUID,
        owner_id: uuid.UUID,
        item_orders: list[tuple[uuid.UUID, int]],
    ) -> None:
        collection = await self.get_collection(collection_id, owner_id)
        item_map = {item.id: item for item in collection.items}
        for item_id, sort_order in item_orders:
            if item_id in item_map:
                await self._item_repo.update(item_map[item_id], sort_order=sort_order)
