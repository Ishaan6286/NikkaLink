"""
FastAPI dependency injection functions.
"""

from __future__ import annotations

import uuid
from collections.abc import AsyncGenerator
from typing import Annotated

import redis.asyncio as redis
from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthenticationError
from app.core.redis_client import close_redis, get_redis
from app.core.security import decode_token
from app.db.session import async_session_factory
from app.models.user import User
from app.repositories.user import UserRepository
from app.services.analytics import AnalyticsService
from app.services.analytics_aggregation import AnalyticsAggregationService
from app.services.auth import AuthService
from app.services.cache import CacheService
from app.services.collections import CollectionService
from app.services.health_monitor import HealthService
from app.services.intelligence import IntelligenceService
from app.services.metadata import MetadataService
from app.services.profile import ProfileService
from app.services.summary import SummaryService
from app.services.url import URLService
from app.events.bus import EventBus
from app.workers.queue import JobQueue

__all__ = ["close_redis", "get_redis"]


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def get_cache_service(
    redis_client: redis.Redis | None = Depends(get_redis),
) -> CacheService:
    return CacheService(redis_client)


async def get_job_queue(
    redis_client: redis.Redis | None = Depends(get_redis),
) -> JobQueue:
    return JobQueue(redis_client)


async def get_event_bus(
    redis_client: redis.Redis | None = Depends(get_redis),
    queue: JobQueue = Depends(get_job_queue),
) -> EventBus:
    return EventBus(redis_client, queue)


async def get_auth_service(
    session: AsyncSession = Depends(get_db),
) -> AuthService:
    return AuthService(session)


async def get_url_service(
    session: AsyncSession = Depends(get_db),
    cache: CacheService = Depends(get_cache_service),
    event_bus: EventBus = Depends(get_event_bus),
) -> URLService:
    return URLService(session, cache, event_bus)


async def get_analytics_service(
    session: AsyncSession = Depends(get_db),
    cache: CacheService = Depends(get_cache_service),
) -> AnalyticsService:
    return AnalyticsService(session, cache)


async def get_metadata_service(
    session: AsyncSession = Depends(get_db),
    cache: CacheService = Depends(get_cache_service),
) -> MetadataService:
    return MetadataService(session, cache)


async def get_health_service(
    session: AsyncSession = Depends(get_db),
    cache: CacheService = Depends(get_cache_service),
) -> HealthService:
    return HealthService(session, cache)


async def get_intelligence_service(
    session: AsyncSession = Depends(get_db),
    cache: CacheService = Depends(get_cache_service),
) -> IntelligenceService:
    return IntelligenceService(session, cache)


async def get_collection_service(
    session: AsyncSession = Depends(get_db),
) -> CollectionService:
    return CollectionService(session)


async def get_summary_service(
    session: AsyncSession = Depends(get_db),
    cache: CacheService = Depends(get_cache_service),
) -> SummaryService:
    return SummaryService(session, cache)


async def get_profile_service(
    session: AsyncSession = Depends(get_db),
) -> ProfileService:
    return ProfileService(session)


async def get_analytics_aggregation_service(
    session: AsyncSession = Depends(get_db),
    cache: CacheService = Depends(get_cache_service),
) -> AnalyticsAggregationService:
    return AnalyticsAggregationService(session, cache)


async def get_current_user(
    authorization: Annotated[str, Header()],
    session: AsyncSession = Depends(get_db),
) -> User:
    if not authorization.startswith("Bearer "):
        raise AuthenticationError("Invalid authorization header format")

    token = authorization.split(" ", 1)[1]
    payload = decode_token(token)

    if payload.get("type") != "access":
        raise AuthenticationError("Invalid token type")

    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationError("Invalid token payload")

    repo = UserRepository(session)
    user = await repo.get_by_id(uuid.UUID(user_id))
    if user is None:
        raise AuthenticationError("User not found")

    if not user.is_active:
        raise AuthenticationError("Account is deactivated")

    return user


async def get_current_active_user(
    user: User = Depends(get_current_user),
) -> User:
    if not user.is_active:
        raise AuthenticationError("Account is deactivated")
    return user


async def get_optional_user(
    authorization: Annotated[str | None, Header()] = None,
    session: AsyncSession = Depends(get_db),
) -> User | None:
    if authorization is None or not authorization.startswith("Bearer "):
        return None

    try:
        return await get_current_user(authorization, session)
    except AuthenticationError:
        return None
