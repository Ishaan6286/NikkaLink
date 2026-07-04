"""
Health check Pydantic schemas.
"""

from __future__ import annotations

from pydantic import BaseModel


class ComponentHealth(BaseModel):
    """Health status of an individual component."""

    status: str  # "healthy" | "unhealthy"
    latency_ms: float | None = None
    message: str | None = None


class HealthResponse(BaseModel):
    """Liveness probe response."""

    status: str
    version: str
    environment: str


class ReadinessResponse(BaseModel):
    """Readiness probe response with component health."""

    status: str
    components: dict[str, ComponentHealth]
