"""
API v1 aggregate router.

Combines all v1 sub-routers and the public redirect endpoint.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse

from app.api.deps import get_analytics_service, get_url_service
from app.api.v1 import analytics, auth, health, urls, feedback
from app.services.analytics import AnalyticsService
from app.services.url import URLService

# Versioned API router
api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(auth.router)
api_v1_router.include_router(urls.router)
api_v1_router.include_router(analytics.router)
api_v1_router.include_router(feedback.router)

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
) -> RedirectResponse:
    """Resolve short code → original URL, track click, redirect."""
    original_url, url_id = await url_service.get_original_url(short_code)

    # Track click asynchronously (fire-and-forget style within the same request)
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

    # Increment click counter
    await url_service.increment_clicks(short_code)

    return RedirectResponse(url=original_url, status_code=302)
