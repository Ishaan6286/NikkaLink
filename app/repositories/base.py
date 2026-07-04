"""
Generic async CRUD repository base class.

Provides reusable create / get / list / update / delete operations
with built-in pagination and sorting support.
"""

from __future__ import annotations

import uuid
from typing import Any, Generic, TypeVar

from sqlalchemy import Select, asc, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """Generic async repository with CRUD + pagination + sorting."""

    def __init__(self, model: type[ModelType], session: AsyncSession) -> None:
        self.model = model
        self.session = session

    async def create(self, **kwargs: Any) -> ModelType:
        """Create and persist a new entity."""
        instance = self.model(**kwargs)
        self.session.add(instance)
        await self.session.flush()
        await self.session.refresh(instance)
        return instance

    async def get_by_id(self, entity_id: uuid.UUID) -> ModelType | None:
        """Get an entity by its primary key."""
        stmt = select(self.model).where(self.model.id == entity_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all(
        self,
        *,
        offset: int = 0,
        limit: int = 20,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        filters: list[Any] | None = None,
    ) -> tuple[list[ModelType], int]:
        """
        Get paginated list of entities with optional sorting and filtering.

        Returns:
            Tuple of (items, total_count).
        """
        # Base query
        stmt: Select = select(self.model)
        count_stmt = select(func.count()).select_from(self.model)

        # Apply filters
        if filters:
            for f in filters:
                stmt = stmt.where(f)
                count_stmt = count_stmt.where(f)

        # Count total
        count_result = await self.session.execute(count_stmt)
        total = count_result.scalar() or 0

        # Sort
        sort_column = getattr(self.model, sort_by, None)
        if sort_column is not None:
            order_func = desc if sort_order == "desc" else asc
            stmt = stmt.order_by(order_func(sort_column))

        # Paginate
        stmt = stmt.offset(offset).limit(limit)

        result = await self.session.execute(stmt)
        items = list(result.scalars().all())

        return items, total

    async def update(self, entity: ModelType, **kwargs: Any) -> ModelType:
        """Update an existing entity."""
        for key, value in kwargs.items():
            if hasattr(entity, key):
                setattr(entity, key, value)
        await self.session.flush()
        await self.session.refresh(entity)
        return entity

    async def delete(self, entity: ModelType) -> None:
        """Hard-delete an entity."""
        await self.session.delete(entity)
        await self.session.flush()
