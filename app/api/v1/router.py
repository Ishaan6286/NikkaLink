"""
API v1 aggregate router.

Combines all v1 sub-routers and the public redirect endpoint.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse

from app.api.deps import get_analytics_service, get_event_bus, get_url_service
from app.api.v1 import analytics, auth, health, urls, feedback, intelligence, events
from app.events.types import EventType
from app.services.analytics import AnalyticsService
from app.services.url import URLService
from app.events.bus import EventBus

# Versioned API router
api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(auth.router)
api_v1_router.include_router(urls.router)
api_v1_router.include_router(analytics.router)
api_v1_router.include_router(feedback.router)
api_v1_router.include_router(intelligence.router)
api_v1_router.include_router(intelligence.collections_router)
api_v1_router.include_router(intelligence.profile_router)
api_v1_router.include_router(intelligence.analytics_router)
api_v1_router.include_router(events.router)

# Health routes registered at root level (no /api/v1 prefix)
health_router = health.router

# Public redirect router (root level)
redirect_router = APIRouter(tags=["Redirect"])


@redirect_router.get(
    "/{short_code}",
    summary="Redirect",
    description="Public redirect endpoint. Resolves a short code and redirects (302) to the original URL.",
    response_class=RedirectResponse,
    status_code=302,
)
async def redirect(
    short_code: str,
    request: Request,
    url_service: URLService = Depends(get_url_service),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
    event_bus: EventBus = Depends(get_event_bus),
) -> RedirectResponse:
    """Resolve short code → original URL, track click, redirect."""
    original_url, url_id = await url_service.get_original_url(short_code)

    client_ip = request.client.host if request.client else "unknown"
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()

    await analytics_service.track_click(
        url_id=url_id,
        ip=client_ip,
        user_agent=request.headers.get("User-Agent"),
        referrer=request.headers.get("Referer"),
    )

    await url_service.increment_clicks(short_code)

    # Publish visit event for async analytics cache update (non-blocking enqueue)
    await event_bus.publish_simple(
        EventType.LINK_VISITED,
        {
            "url_id": str(url_id),
            "short_code": short_code,
        },
        correlation_id=request.headers.get("X-Correlation-ID"),
    )

    return RedirectResponse(url=original_url, status_code=302)
