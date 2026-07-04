"""
Common schemas: pagination, sorting, error responses.
"""

from __future__ import annotations

from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class ErrorDetail(BaseModel):
    """Single error detail."""

    code: str
    message: str
    details: dict | None = None


class ErrorResponse(BaseModel):
    """Standard error response envelope."""

    error: ErrorDetail


class PaginationParams(BaseModel):
    """Query parameters for pagination."""

    page: int = Field(default=1, ge=1, description="Page number")
    page_size: int = Field(default=20, ge=1, le=100, description="Items per page")

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


class SortParams(BaseModel):
    """Query parameters for sorting."""

    sort_by: str = Field(default="created_at", description="Field to sort by")
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$", description="Sort direction")


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response envelope."""

    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int

    @classmethod
    def create(
        cls,
        items: list[T],
        total: int,
        page: int,
        page_size: int,
    ) -> PaginatedResponse[T]:
        total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
        return cls(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
