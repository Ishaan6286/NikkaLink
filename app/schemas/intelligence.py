"""Link intelligence platform schemas."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


# ── Metadata ────────────────────────────────────────────────────────────────

class MetadataResponse(BaseModel):
    url_id: uuid.UUID
    canonical_url: str | None = None
    title: str | None = None
    description: str | None = None
    site_name: str | None = None
    og_image_url: str | None = None
    favicon_url: str | None = None
    language: str | None = None
    content_type: str | None = None
    fetched_at: datetime | None = None
    fetch_error: str | None = None

    model_config = {"from_attributes": True}


class MetadataPreviewRequest(BaseModel):
    url: str = Field(description="URL to preview metadata for")


class MetadataPreviewResponse(BaseModel):
    canonical_url: str | None = None
    title: str | None = None
    description: str | None = None
    site_name: str | None = None
    og_image_url: str | None = None
    favicon_url: str | None = None
    language: str | None = None
    content_type: str | None = None


# ── Health ──────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    url_id: uuid.UUID
    status: str
    last_checked_at: datetime | None = None
    failure_reason: str | None = None
    response_time_ms: int | None = None
    availability_pct: float = 100.0
    ssl_expires_at: datetime | None = None
    http_status_code: int | None = None

    model_config = {"from_attributes": True}


# ── Notes ───────────────────────────────────────────────────────────────────

class URLNotesUpdate(BaseModel):
    note_title: str | None = Field(default=None, max_length=200)
    private_notes: str | None = Field(default=None, max_length=5000)
    is_favorite: bool | None = None
    is_pinned: bool | None = None
    color_label: str | None = Field(default=None, max_length=20)


class URLNotesResponse(BaseModel):
    note_title: str | None = None
    private_notes: str | None = None
    is_favorite: bool = False
    is_pinned: bool = False
    color_label: str | None = None


# ── Collections ─────────────────────────────────────────────────────────────

class CollectionCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str | None = None
    parent_id: uuid.UUID | None = None
    color: str | None = Field(default=None, max_length=20)


class CollectionUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=120)
    description: str | None = None
    color: str | None = None
    is_pinned: bool | None = None
    sort_order: int | None = None


class CollectionItemResponse(BaseModel):
    id: uuid.UUID
    url_id: uuid.UUID
    short_code: str
    original_url: str
    note_title: str | None = None
    sort_order: int

    model_config = {"from_attributes": True}


class CollectionResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None = None
    parent_id: uuid.UUID | None = None
    color: str | None = None
    sort_order: int = 0
    is_pinned: bool = False
    item_count: int = 0
    children: list["CollectionResponse"] = Field(default_factory=list)
    created_at: datetime

    model_config = {"from_attributes": True}


class BulkMoveRequest(BaseModel):
    url_ids: list[uuid.UUID] = Field(min_length=1, max_length=100)
    target_collection_id: uuid.UUID


class ReorderItemsRequest(BaseModel):
    items: list[dict] = Field(description="List of {item_id, sort_order}")


# ── Intelligence ────────────────────────────────────────────────────────────

class DuplicateCheckRequest(BaseModel):
    original_url: str


class DuplicateCheckResponse(BaseModel):
    is_duplicate: bool
    existing: dict | None = None


class AliasSuggestionsRequest(BaseModel):
    original_url: str
    title: str | None = None


class AliasSuggestionsResponse(BaseModel):
    suggestions: list[str]


# ── AI Summary ──────────────────────────────────────────────────────────────

class SummaryResponse(BaseModel):
    url_id: uuid.UUID
    summary: str
    key_points: list[str] | None = None
    reading_time_min: int | None = None
    language: str | None = None
    generated_at: datetime
    prompt_version: str

    model_config = {"from_attributes": True}


# ── Profile ─────────────────────────────────────────────────────────────────

class ProfileUpdate(BaseModel):
    display_name: str | None = Field(default=None, max_length=100)
    bio: str | None = Field(default=None, max_length=1000)
    avatar_url: str | None = None
    profile_slug: str | None = Field(default=None, max_length=50)
    is_profile_public: bool | None = None
    theme_config: dict | None = None
    social_links: dict | None = None


class PublicProfileResponse(BaseModel):
    username: str
    profile_slug: str | None
    display_name: str
    bio: str | None = None
    avatar_url: str | None = None
    social_links: dict = Field(default_factory=dict)
    theme_config: dict = Field(default_factory=dict)
    pinned_links: list[dict] = Field(default_factory=list)
    public_stats: dict = Field(default_factory=dict)


# ── Advanced Analytics ────────────────────────────────────────────────────────

class AdvancedAnalyticsResponse(BaseModel):
    time_series: list[dict] = Field(default_factory=list)
    totals: dict = Field(default_factory=dict)
    top_countries: dict = Field(default_factory=dict)
    top_devices: dict = Field(default_factory=dict)
    top_browsers: dict = Field(default_factory=dict)
    aggregates: list[dict] = Field(default_factory=list)


class TrendingLinksResponse(BaseModel):
    links: list[dict] = Field(default_factory=list)
