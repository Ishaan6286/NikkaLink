"""
URL shortening API routes.

Endpoints:
  POST   /api/v1/urls          — Create a short URL
  POST   /api/v1/urls/bulk     — Bulk create short URLs
  GET    /api/v1/urls          — List user's URLs (paginated)
  GET    /api/v1/urls/{code}   — Get URL details
  PATCH  /api/v1/urls/{code}   — Update URL
  DELETE /api/v1/urls/{code}   — Soft delete URL
  GET    /api/v1/urls/{code}/qr — Get QR code image
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import Response

from app.api.deps import get_current_active_user, get_optional_user, get_url_service
from app.core.config import get_settings
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.url import (
    BulkURLCreate,
    BulkURLResponse,
    URLCreate,
    URLResponse,
    URLUpdate,
)
from app.services.url import URLService
from app.utils.qr import generate_qr_code

router = APIRouter(prefix="/urls", tags=["URLs"])


@router.get(
    "/qr/generate",
    summary="Generate QR code from any URL (public)",
    description="Generate a QR code PNG for any URL without authentication or shortening.",
    responses={200: {"content": {"image/png": {}}}},
)
async def generate_qr_from_url(
    url: str = Query(..., description="The URL to encode into a QR code"),
) -> Response:
    qr_bytes = generate_qr_code(url)
    return Response(
        content=qr_bytes,
        media_type="image/png",
        headers={"Content-Disposition": 'inline; filename="qr.png"'},
    )


@router.post(
    "",
    response_model=URLResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create short URL",
    description="Shorten a URL with optional custom alias, expiration, and tags.",
)
async def create_url(
    data: URLCreate,
    current_user: User | None = Depends(get_optional_user),
    url_service: URLService = Depends(get_url_service),
) -> URLResponse:
    owner_id = current_user.id if current_user else None
    return await url_service.create_short_url(data, owner_id)


@router.post(
    "/bulk",
    response_model=BulkURLResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Bulk create short URLs",
    description="Create multiple short URLs at once (max 50).",
)
async def bulk_create(
    data: BulkURLCreate,
    current_user: User = Depends(get_current_active_user),
    url_service: URLService = Depends(get_url_service),
) -> BulkURLResponse:
    created, errors = await url_service.bulk_create(data.urls, current_user.id)
    return BulkURLResponse(created=created, errors=errors)


@router.get(
    "",
    response_model=PaginatedResponse[URLResponse],
    summary="List URLs",
    description="Get a paginated list of the current user's URLs with search and filtering.",
)
async def list_urls(
    current_user: User = Depends(get_current_active_user),
    url_service: URLService = Depends(get_url_service),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    sort_by: str = Query(default="created_at"),
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$"),
    query: str | None = Query(default=None),
    tag: str | None = Query(default=None),
    is_active: bool | None = Query(default=None),
) -> PaginatedResponse[URLResponse]:
    offset = (page - 1) * page_size
    urls, total = await url_service.get_user_urls(
        current_user.id,
        offset=offset,
        limit=page_size,
        sort_by=sort_by,
        sort_order=sort_order,
        query=query,
        tag=tag,
        is_active=is_active,
    )
    return PaginatedResponse[URLResponse].create(
        items=urls,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{short_code}",
    response_model=URLResponse,
    summary="Get URL details",
    description="Get details for a specific short URL.",
)
async def get_url(
    short_code: str,
    current_user: User | None = Depends(get_optional_user),
    url_service: URLService = Depends(get_url_service),
) -> URLResponse:
    return await url_service.get_url_by_short_code(short_code)


@router.patch(
    "/{short_code}",
    response_model=URLResponse,
    summary="Update URL",
    description="Update the original URL, expiration, active status, or tags.",
)
async def update_url(
    short_code: str,
    data: URLUpdate,
    current_user: User = Depends(get_current_active_user),
    url_service: URLService = Depends(get_url_service),
) -> URLResponse:
    return await url_service.update_url(short_code, data, current_user.id)


@router.delete(
    "/{short_code}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete URL",
    description="Soft-delete a short URL. The URL will no longer redirect.",
)
async def delete_url(
    short_code: str,
    current_user: User = Depends(get_current_active_user),
    url_service: URLService = Depends(get_url_service),
):
    await url_service.soft_delete_url(short_code, current_user.id)


@router.get(
    "/{short_code}/qr",
    summary="Get QR code",
    description="Generate and download a QR code image for the short URL.",
    responses={200: {"content": {"image/png": {}}}},
)
async def get_qr_code(
    short_code: str,
    current_user: User | None = Depends(get_optional_user),
    url_service: URLService = Depends(get_url_service),
) -> Response:
    # Verify URL exists
    url_response = await url_service.get_url_by_short_code(short_code)
    settings = get_settings()
    short_url = f"{settings.BASE_URL.rstrip('/')}/{short_code}"
    qr_bytes = generate_qr_code(short_url)
    return Response(
        content=qr_bytes,
        media_type="image/png",
        headers={
            "Content-Disposition": f'inline; filename="{short_code}.png"',
        },
    )
