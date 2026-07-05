"""
URL-related Pydantic schemas.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field, HttpUrl, field_validator


class URLCreate(BaseModel):
    """Request schema to create a shortened URL."""

    original_url: str = Field(description="The URL to shorten")
    custom_alias: str | None = Field(
        default=None,
        min_length=3,
        max_length=32,
        pattern=r"^[a-zA-Z0-9_-]+$",
        description="Optional custom alias (alphanumeric, hyphens, underscores)",
    )
    expires_at: datetime | None = Field(
        default=None,
        description="Optional expiration datetime (ISO 8601)",
    )
    tags: list[str] | None = Field(
        default=None,
        max_length=10,
        description="Optional list of tags (max 10)",
    )

    @field_validator("original_url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        """Validate that the URL is well-formed."""
        # Use Pydantic's HttpUrl for validation, but store as string
        HttpUrl(v)
        return v

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: list[str] | None) -> list[str] | None:
        if v is not None:
            return [tag.strip().lower() for tag in v if tag.strip()]
        return v


class URLUpdate(BaseModel):
    """Request schema to update a shortened URL."""

    original_url: str | None = None
    expires_at: datetime | None = None
    is_active: bool | None = None
    tags: list[str] | None = None

    @field_validator("original_url")
    @classmethod
    def validate_url(cls, v: str | None) -> str | None:
        if v is not None:
            HttpUrl(v)
        return v


class URLResponse(BaseModel):
    """Response schema for a shortened URL."""

    id: uuid.UUID
    short_code: str
    short_url: str
    original_url: str
    custom_alias: str | None = None
    owner_id: uuid.UUID | None
    expires_at: datetime | None = None
    is_active: bool
    tags: list[str] | None = None
    total_clicks: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BulkURLCreate(BaseModel):
    """Request schema for bulk URL creation."""

    urls: list[URLCreate] = Field(min_length=1, max_length=50)


class BulkURLResponse(BaseModel):
    """Response schema for bulk URL creation."""

    created: list[URLResponse]
    errors: list[dict] = Field(default_factory=list)


class URLSearchParams(BaseModel):
    """Query parameters for searching URLs."""

    query: str | None = Field(default=None, description="Search in original URL and tags")
    tag: str | None = Field(default=None, description="Filter by tag")
    is_active: bool | None = Field(default=None, description="Filter by active status")
