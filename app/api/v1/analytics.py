"""
Analytics API routes.

Endpoints:
  GET /api/v1/analytics/{code}            — Full analytics dashboard
  GET /api/v1/analytics/{code}/clicks     — Paginated click list
  GET /api/v1/analytics/{code}/timeseries — Time series data
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse, Response

from app.api.deps import get_analytics_service, get_optional_user, get_url_service
from app.core.exceptions import AuthorizationError
from app.models.user import User
from app.schemas.analytics import AnalyticsSummary, ClickResponse, TimeSeriesPoint
from app.schemas.common import PaginatedResponse
from app.services.analytics import AnalyticsService
from app.services.url import URLService

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get(
    "/{short_code}",
    response_model=AnalyticsSummary,
    summary="Analytics dashboard",
    description="Get comprehensive analytics for a short URL including clicks, browsers, devices, OS, referrers, and time series.",
)
async def get_analytics(
    short_code: str,
    current_user: User | None = Depends(get_optional_user),
    url_service: URLService = Depends(get_url_service),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
) -> AnalyticsSummary:
    url = await url_service.get_url_by_short_code(short_code)

    return await analytics_service.get_summary(
        url_id=url.id,
        short_code=url.short_code,
        original_url=url.original_url,
        total_clicks=url.total_clicks,
        created_at=url.created_at,
    )


@router.get(
    "/{short_code}/clicks",
    response_model=PaginatedResponse[ClickResponse],
    summary="Click list",
    description="Get a paginated list of individual click events.",
)
async def get_clicks(
    short_code: str,
    current_user: User | None = Depends(get_optional_user),
    url_service: URLService = Depends(get_url_service),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> PaginatedResponse[ClickResponse]:
    url = await url_service.get_url_by_short_code(short_code)

    offset = (page - 1) * page_size
    clicks, total = await analytics_service.get_clicks(
        url_id=url.id,
        offset=offset,
        limit=page_size,
    )
    return PaginatedResponse[ClickResponse].create(
        items=clicks,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{short_code}/timeseries",
    response_model=list[TimeSeriesPoint],
    summary="Time series",
    description="Get click counts per day for the last N days.",
)
async def get_timeseries(
    short_code: str,
    current_user: User | None = Depends(get_optional_user),
    url_service: URLService = Depends(get_url_service),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
    days: int = Query(default=30, ge=1, le=365),
) -> list[TimeSeriesPoint]:
    url = await url_service.get_url_by_short_code(short_code)

    return await analytics_service.get_time_series(url_id=url.id, days=days)


@router.get(
    "/{short_code}/export/json",
    summary="Export analytics as JSON",
)
async def export_analytics_json(
    short_code: str,
    url_service: URLService = Depends(get_url_service),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
) -> JSONResponse:
    url = await url_service.get_url_by_short_code(short_code)
    summary = await analytics_service.get_summary(
        url_id=url.id,
        short_code=url.short_code,
        original_url=url.original_url,
        total_clicks=url.total_clicks,
        created_at=url.created_at,
    )
    return JSONResponse(
        content=summary.model_dump(mode="json"),
        headers={"Content-Disposition": f'attachment; filename="{short_code}-analytics.json"'},
    )


@router.get(
    "/{short_code}/export/csv",
    summary="Export analytics as CSV",
)
async def export_analytics_csv(
    short_code: str,
    url_service: URLService = Depends(get_url_service),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
) -> Response:
    import csv
    import io

    url = await url_service.get_url_by_short_code(short_code)
    summary = await analytics_service.get_summary(
        url_id=url.id,
        short_code=url.short_code,
        original_url=url.original_url,
        total_clicks=url.total_clicks,
        created_at=url.created_at,
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["metric", "value"])
    writer.writerow(["short_code", summary.short_code])
    writer.writerow(["total_clicks", summary.total_clicks])
    writer.writerow(["unique_visitors", summary.unique_visitors])
    for point in summary.time_series:
        writer.writerow([f"clicks_{point.date}", point.clicks])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{short_code}-analytics.csv"'},
    )
