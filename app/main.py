"""
FastAPI application factory.

Creates and configures the FastAPI app with:
  - OpenAPI metadata and tags
  - Lifespan management (startup/shutdown for DB and Redis)
  - Middleware stack (request ID, correlation ID, rate limiter, logging, CORS)
  - Exception handlers
  - Versioned API routers + public redirect
  - Structured logging configuration
"""

from __future__ import annotations

import logging
import sys
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_v1_router, health_router, redirect_router
from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.redis_client import close_redis, init_redis, is_redis_available
from app.db.session import engine
from app.middleware.correlation_id import CorrelationIDMiddleware
from app.middleware.logging import RequestLoggingMiddleware
from app.middleware.rate_limiter import RateLimiterMiddleware
from app.middleware.request_id import RequestIDMiddleware


def configure_logging() -> None:
    """Configure structlog for structured JSON logging."""
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.StackInfoRenderer(),
            structlog.dev.set_exc_info,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(file=sys.stdout),
        cache_logger_on_first_use=True,
    )


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan: startup and shutdown hooks."""
    logger = structlog.get_logger()

    # ── Startup ──────────────────────────────────────────────────────────
    await logger.ainfo("application_starting", version=get_settings().APP_VERSION)

    # Warm up Redis connection (non-fatal if unavailable)
    await init_redis()
    if not is_redis_available():
        await logger.awarning("redis_unavailable_at_startup")

    yield

    # ── Shutdown ─────────────────────────────────────────────────────────
    await logger.ainfo("application_shutting_down")
    await close_redis()
    await engine.dispose()
    await logger.ainfo("application_stopped")


def create_app() -> FastAPI:
    """Build and return the configured FastAPI application."""
    settings = get_settings()

    # Configure structured logging
    configure_logging()

    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description=(
            "A production-ready URL Shortener API with analytics, "
            "rate limiting, and JWT authentication."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        openapi_tags=[
            {
                "name": "Authentication",
                "description": "User registration, login, and JWT token management.",
            },
            {
                "name": "URLs",
                "description": "Create, manage, and search shortened URLs.",
            },
            {
                "name": "Analytics",
                "description": "Click tracking, visitor analytics, and dashboards.",
            },
            {
                "name": "Health",
                "description": "Liveness and readiness probes for monitoring.",
            },
            {
                "name": "Redirect",
                "description": "Public URL redirect endpoint.",
            },
        ],
        lifespan=lifespan,
    )

    # ── Exception Handlers ───────────────────────────────────────────────
    register_exception_handlers(app)

    # ── Middleware (order matters: outermost first) ───────────────────────
    # CORS (outermost)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=[
            "X-Request-ID",
            "X-Correlation-ID",
            "X-RateLimit-Limit",
            "X-RateLimit-Remaining",
            "X-RateLimit-Reset",
            "Retry-After",
        ],
    )

    # Request ID → Correlation ID → Logging → Rate Limiter
    app.add_middleware(RequestIDMiddleware)
    app.add_middleware(CorrelationIDMiddleware)
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(RateLimiterMiddleware)

    # ── Routers ──────────────────────────────────────────────────────────
    app.include_router(api_v1_router)
    app.include_router(health_router)
    app.include_router(redirect_router)  # Public redirect at /{short_code}

    return app


# Application instance used by Uvicorn
app = create_app()
