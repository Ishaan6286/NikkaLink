"""
Link intelligence API routes — metadata, health, notes, duplicates, aliases, summaries.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import (
    get_cache_service,
    get_collection_service,
    get_current_active_user,
    get_event_bus,
    get_health_service,
    get_intelligence_service,
    get_metadata_service,
    get_profile_service,
    get_summary_service,
    get_url_service,
    get_analytics_aggregation_service,
)
from app.events.bus import EventBus
from app.events.types import EventType
from app.models.user import User
from app.schemas.intelligence import (
    AdvancedAnalyticsResponse,
    AliasSuggestionsRequest,
    AliasSuggestionsResponse,
    BulkMoveRequest,
    CollectionCreate,
    CollectionResponse,
    CollectionUpdate,
    DuplicateCheckRequest,
    DuplicateCheckResponse,
    HealthResponse,
    MetadataPreviewRequest,
    MetadataPreviewResponse,
    MetadataResponse,
    ProfileUpdate,
    PublicProfileResponse,
    SummaryResponse,
    TrendingLinksResponse,
    URLNotesResponse,
    URLNotesUpdate,
)
from app.services.analytics_aggregation import AnalyticsAggregationService
from app.services.cache import CacheService
from app.services.collections import CollectionService
from app.services.health_monitor import HealthService
from app.services.intelligence import IntelligenceService
from app.services.metadata import MetadataService
from app.services.profile import ProfileService
from app.services.summary import SummaryService
from app.services.url import URLService
from app.workers.queue import JobQueue, JobType

router = APIRouter(prefix="/intelligence", tags=["Link Intelligence"])


# ── Metadata ────────────────────────────────────────────────────────────────

@router.post("/metadata/preview", response_model=MetadataPreviewResponse)
async def preview_metadata(
    data: MetadataPreviewRequest,
    metadata_service: MetadataService = Depends(get_metadata_service),
) -> MetadataPreviewResponse:
    result = await metadata_service.preview_url(data.url)
    return MetadataPreviewResponse(**result)


@router.get("/metadata/{short_code}", response_model=MetadataResponse)
async def get_metadata(
    short_code: str,
    current_user: User = Depends(get_current_active_user),
    metadata_service: MetadataService = Depends(get_metadata_service),
    url_service: URLService = Depends(get_url_service),
) -> MetadataResponse:
    url = await url_service.get_url_by_short_code(short_code)
    meta = await metadata_service.get_metadata(url.id)
    return MetadataResponse.model_validate(meta)


@router.post("/metadata/{short_code}/refresh", response_model=MetadataResponse)
async def refresh_metadata(
    short_code: str,
    current_user: User = Depends(get_current_active_user),
    metadata_service: MetadataService = Depends(get_metadata_service),
    url_service: URLService = Depends(get_url_service),
) -> MetadataResponse:
    url = await url_service.get_url_by_short_code(short_code)
    meta = await metadata_service.fetch_and_store(url.id, url.original_url, force_refresh=True)
    return MetadataResponse.model_validate(meta)


# ── Health ──────────────────────────────────────────────────────────────────

@router.get("/health/{short_code}", response_model=HealthResponse)
async def get_link_health(
    short_code: str,
    current_user: User = Depends(get_current_active_user),
    health_service: HealthService = Depends(get_health_service),
    url_service: URLService = Depends(get_url_service),
) -> HealthResponse:
    url = await url_service.get_url_by_short_code(short_code)
    health = await health_service.get_health(url.id)
    return HealthResponse.model_validate(health)


@router.post("/health/{short_code}/check", response_model=HealthResponse)
async def check_link_health_now(
    short_code: str,
    current_user: User = Depends(get_current_active_user),
    health_service: HealthService = Depends(get_health_service),
    url_service: URLService = Depends(get_url_service),
) -> HealthResponse:
    url = await url_service.get_url_by_short_code(short_code)
    health = await health_service.check_url(url.id, url.original_url)
    return HealthResponse.model_validate(health)


# ── Notes ───────────────────────────────────────────────────────────────────

@router.patch("/notes/{short_code}", response_model=URLNotesResponse)
async def update_link_notes(
    short_code: str,
    data: URLNotesUpdate,
    current_user: User = Depends(get_current_active_user),
    url_service: URLService = Depends(get_url_service),
) -> URLNotesResponse:
    from app.schemas.url import URLUpdate
    update = URLUpdate(**data.model_dump(exclude_unset=True))
    result = await url_service.update_url(short_code, update, current_user.id)
    return URLNotesResponse(
        note_title=result.note_title,
        private_notes=result.private_notes,
        is_favorite=result.is_favorite,
        is_pinned=result.is_pinned,
        color_label=result.color_label,
    )


# ── Duplicate Detection ─────────────────────────────────────────────────────

@router.post("/duplicates/check", response_model=DuplicateCheckResponse)
async def check_duplicate(
    data: DuplicateCheckRequest,
    current_user: User = Depends(get_current_active_user),
    intelligence_service: IntelligenceService = Depends(get_intelligence_service),
    url_service: URLService = Depends(get_url_service),
) -> DuplicateCheckResponse:
    from app.core.config import get_settings
    result = await intelligence_service.check_duplicate(
        data.original_url,
        current_user.id,
        build_short_url=get_settings().public_app_url,
    )
    if result is None:
        return DuplicateCheckResponse(is_duplicate=False)
    return DuplicateCheckResponse(**result)


# ── Alias Suggestions ───────────────────────────────────────────────────────

@router.post("/aliases/suggest", response_model=AliasSuggestionsResponse)
async def suggest_aliases(
    data: AliasSuggestionsRequest,
    current_user: User = Depends(get_current_active_user),
    intelligence_service: IntelligenceService = Depends(get_intelligence_service),
) -> AliasSuggestionsResponse:
    suggestions = await intelligence_service.suggest_aliases(
        data.original_url,
        current_user.id,
        title=data.title,
    )
    return AliasSuggestionsResponse(suggestions=suggestions)


# ── AI Summary ──────────────────────────────────────────────────────────────

@router.get("/summary/{short_code}", response_model=SummaryResponse)
async def get_summary(
    short_code: str,
    current_user: User = Depends(get_current_active_user),
    summary_service: SummaryService = Depends(get_summary_service),
    url_service: URLService = Depends(get_url_service),
) -> SummaryResponse:
    url = await url_service.get_url_by_short_code(short_code)
    summary = await summary_service.get_summary(url.id)
    if summary is None:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Summary", short_code)
    return SummaryResponse.model_validate(summary)


@router.post(
    "/summary/{short_code}/generate",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Request AI summary generation",
    description="Queues summary generation asynchronously. Returns immediately; listen to SSE for SummaryGenerated.",
)
async def generate_summary(
    short_code: str,
    force: bool = Query(default=False),
    current_user: User = Depends(get_current_active_user),
    summary_service: SummaryService = Depends(get_summary_service),
    url_service: URLService = Depends(get_url_service),
    event_bus: EventBus = Depends(get_event_bus),
) -> dict:
    url = await url_service.get_url_by_short_code(short_code)

    existing = await summary_service.get_summary(url.id)
    if existing and not force:
        return {
            "status": "completed",
            "summary": SummaryResponse.model_validate(existing).model_dump(mode="json"),
        }

    event = await event_bus.publish_simple(
        EventType.SUMMARY_REQUESTED,
        {
            "url_id": str(url.id),
            "short_code": short_code,
            "owner_id": str(current_user.id),
            "force": force,
        },
    )
    return {
        "status": "accepted",
        "message": "Summary generation started",
        "event_id": event.event_id,
    }


# ── Collections ─────────────────────────────────────────────────────────────

collections_router = APIRouter(prefix="/collections", tags=["Collections"])


@collections_router.get("", response_model=list[CollectionResponse])
async def list_collections(
    current_user: User = Depends(get_current_active_user),
    collection_service: CollectionService = Depends(get_collection_service),
    parent_id: uuid.UUID | None = Query(default=None),
) -> list[CollectionResponse]:
    collections = await collection_service.list_collections(current_user.id, parent_id=parent_id)
    return [
        CollectionResponse(
            id=c.id,
            name=c.name,
            description=c.description,
            parent_id=c.parent_id,
            color=c.color,
            sort_order=c.sort_order,
            is_pinned=c.is_pinned,
            item_count=len(c.items) if hasattr(c, "items") else 0,
            created_at=c.created_at,
        )
        for c in collections
    ]


@collections_router.post("", response_model=CollectionResponse, status_code=status.HTTP_201_CREATED)
async def create_collection(
    data: CollectionCreate,
    current_user: User = Depends(get_current_active_user),
    collection_service: CollectionService = Depends(get_collection_service),
) -> CollectionResponse:
    c = await collection_service.create_collection(
        current_user.id,
        name=data.name,
        description=data.description,
        parent_id=data.parent_id,
        color=data.color,
    )
    return CollectionResponse(
        id=c.id, name=c.name, description=c.description,
        parent_id=c.parent_id, color=c.color, sort_order=c.sort_order,
        is_pinned=c.is_pinned, created_at=c.created_at,
    )


@collections_router.post("/bulk-move")
async def bulk_move_urls(
    data: BulkMoveRequest,
    current_user: User = Depends(get_current_active_user),
    collection_service: CollectionService = Depends(get_collection_service),
) -> dict:
    moved = await collection_service.bulk_move(
        data.url_ids, data.target_collection_id, current_user.id
    )
    return {"moved": moved}


# ── Profile ─────────────────────────────────────────────────────────────────

profile_router = APIRouter(prefix="/profiles", tags=["Profiles"])


@profile_router.get("/u/{slug}", response_model=PublicProfileResponse)
async def get_public_profile(
    slug: str,
    profile_service: ProfileService = Depends(get_profile_service),
) -> PublicProfileResponse:
    profile = await profile_service.get_public_profile(slug)
    return PublicProfileResponse(**profile)


@profile_router.patch("/me", response_model=ProfileUpdate)
async def update_my_profile(
    data: ProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    profile_service: ProfileService = Depends(get_profile_service),
) -> ProfileUpdate:
    await profile_service.update_profile(
        current_user.id,
        **data.model_dump(exclude_unset=True),
    )
    return data


# ── Advanced Analytics ────────────────────────────────────────────────────────

analytics_router = APIRouter(prefix="/analytics-advanced", tags=["Advanced Analytics"])


@analytics_router.get("/{short_code}", response_model=AdvancedAnalyticsResponse)
async def get_advanced_analytics(
    short_code: str,
    days: int = Query(default=30, ge=1, le=365),
    current_user: User = Depends(get_current_active_user),
    url_service: URLService = Depends(get_url_service),
    agg_service: AnalyticsAggregationService = Depends(get_analytics_aggregation_service),
) -> AdvancedAnalyticsResponse:
    url = await url_service.get_url_by_short_code(short_code)
    dashboard = await agg_service.get_aggregated_dashboard(url.id, days=days)
    return AdvancedAnalyticsResponse(**dashboard)


@analytics_router.get("/trending/links", response_model=TrendingLinksResponse)
async def get_trending_links(
    current_user: User = Depends(get_current_active_user),
    agg_service: AnalyticsAggregationService = Depends(get_analytics_aggregation_service),
    limit: int = Query(default=10, ge=1, le=50),
) -> TrendingLinksResponse:
    links = await agg_service.get_trending_links(limit=limit)
    return TrendingLinksResponse(links=links)
