"""
Health check API routes.

Endpoints:
  GET /health — Liveness probe (always 200 if the process is running)
  GET /ready  — Readiness probe (checks DB and Redis connectivity)
"""

from __future__ import annotations

import time

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.config import get_settings
from app.core.redis_client import get_redis, is_redis_available
from app.schemas.health import ComponentHealth, HealthResponse, ReadinessResponse

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Liveness probe",
    description="Returns 200 if the application process is alive.",
)
async def health() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(
        status="healthy",
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
    )


@router.get(
    "/ready",
    response_model=ReadinessResponse,
    summary="Readiness probe",
    description="Checks connectivity to PostgreSQL and Redis. PostgreSQL is required; Redis is optional.",
)
async def ready(
    session: AsyncSession = Depends(get_db),
) -> ReadinessResponse:
    components: dict[str, ComponentHealth] = {}

    # Check PostgreSQL
    try:
        start = time.perf_counter()
        await session.execute(text("SELECT 1"))
        latency = (time.perf_counter() - start) * 1000
        components["postgresql"] = ComponentHealth(
            status="healthy",
            latency_ms=round(latency, 2),
        )
    except Exception as e:
        components["postgresql"] = ComponentHealth(
            status="unhealthy",
            message=str(e),
        )

    # Check Redis (optional — app runs without it)
    redis_client = await get_redis()
    if redis_client is None:
        components["redis"] = ComponentHealth(
            status="degraded",
            message="Redis unavailable — caching and rate limiting disabled",
        )
    else:
        try:
            start = time.perf_counter()
            await redis_client.ping()
            latency = (time.perf_counter() - start) * 1000
            components["redis"] = ComponentHealth(
                status="healthy",
                latency_ms=round(latency, 2),
            )
        except Exception as e:
            components["redis"] = ComponentHealth(
                status="degraded",
                message=str(e),
            )

    postgres_healthy = components["postgresql"].status == "healthy"
    redis_healthy = is_redis_available()
    if postgres_healthy and redis_healthy:
        overall = "healthy"
    elif postgres_healthy:
        overall = "degraded"
    else:
        overall = "unhealthy"

    return ReadinessResponse(status=overall, components=components)
