"""
FastAPI dependency injection functions.

Provides database sessions, Redis clients, service instances,
and authentication dependencies for route handlers.
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
from app.services.auth import AuthService
from app.services.cache import CacheService
from app.services.url import URLService

# Re-export Redis helpers for backward compatibility
__all__ = ["close_redis", "get_redis"]


# ── Database Session ─────────────────────────────────────────────────────────


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield an async database session."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ── Service Factories ────────────────────────────────────────────────────────


async def get_cache_service(
    redis_client: redis.Redis | None = Depends(get_redis),
) -> CacheService:
    """Construct CacheService."""
    return CacheService(redis_client)


async def get_auth_service(
    session: AsyncSession = Depends(get_db),
) -> AuthService:
    """Construct AuthService."""
    return AuthService(session)


async def get_url_service(
    session: AsyncSession = Depends(get_db),
    cache: CacheService = Depends(get_cache_service),
) -> URLService:
    """Construct URLService."""
    return URLService(session, cache)


async def get_analytics_service(
    session: AsyncSession = Depends(get_db),
    cache: CacheService = Depends(get_cache_service),
) -> AnalyticsService:
    """Construct AnalyticsService."""
    return AnalyticsService(session, cache)


# ── Authentication Dependencies ──────────────────────────────────────────────


async def get_current_user(
    authorization: Annotated[str, Header()],
    session: AsyncSession = Depends(get_db),
) -> User:
    """
    Extract and validate the JWT from the Authorization header,
    then load and return the User.

    Raises:
        AuthenticationError: If the token is missing, invalid, or the user doesn't exist.
    """
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
    """Ensure the user is active."""
    if not user.is_active:
        raise AuthenticationError("Account is deactivated")
    return user


async def get_optional_user(
    authorization: Annotated[str | None, Header()] = None,
    session: AsyncSession = Depends(get_db),
) -> User | None:
    """
    Optionally authenticate the user. Returns None if no
    Authorization header is provided.
    """
    if authorization is None or not authorization.startswith("Bearer "):
        return None

    try:
        return await get_current_user(authorization, session)
    except AuthenticationError:
        return None
