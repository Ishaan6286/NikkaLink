"""
Health check API routes.

Endpoints:
  GET /health — Liveness probe (always 200 if the process is running)
  GET /ready  — Readiness probe (checks DB and Redis connectivity)
"""

from __future__ import annotations

import time

import redis.asyncio as redis
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_redis
from app.core.config import get_settings
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
    description="Checks connectivity to PostgreSQL and Redis. Returns 200 only if all components are healthy.",
)
async def ready(
    session: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
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

    # Check Redis
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
            status="unhealthy",
            message=str(e),
        )

    overall = "healthy" if all(c.status == "healthy" for c in components.values()) else "unhealthy"

    return ReadinessResponse(status=overall, components=components)
