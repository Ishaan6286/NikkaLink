"""
Shared pytest fixtures for the URL Shortener test suite.

Provides:
  - Async SQLite test database (no PostgreSQL dependency for unit tests)
  - fakeredis for Redis mocking
  - httpx AsyncClient for API integration tests
  - Factory fixtures for users, tokens, and URLs
"""

from __future__ import annotations

import asyncio
import uuid
from collections.abc import AsyncGenerator
from typing import Any
from unittest.mock import AsyncMock

import fakeredis.aioredis
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool

from app.core.config import Settings, get_settings
from app.core.security import create_access_token, hash_password
from app.db.base import Base
import app.models  # noqa: F401 - ensure models are registered with Base.metadata

TEST_DATABASE_URL = "postgresql+asyncpg://shortener:shortener@postgres:5432/shortener_test"


def get_test_settings() -> Settings:
    """Return settings configured for testing."""
    return Settings(
        DATABASE_URL=TEST_DATABASE_URL,
        REDIS_URL="redis://localhost:6379/0",
        JWT_SECRET_KEY="test-secret-key-for-testing-only",
        ENVIRONMENT="testing",
        DEBUG=False,
        RATE_LIMIT_ANONYMOUS=1000,  # Generous limits for tests
        RATE_LIMIT_AUTHENTICATED=5000,
    )


# ── Database Fixtures ────────────────────────────────────────────────────────

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False, poolclass=NullPool)
test_session_factory = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest_asyncio.fixture(autouse=True)
async def setup_database() -> AsyncGenerator[None, None]:
    """Create tables before each test and drop after."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide a test database session."""
    async with test_session_factory() as session:
        yield session
        await session.rollback()


# ── Redis Fixture ────────────────────────────────────────────────────────────

@pytest_asyncio.fixture
async def fake_redis() -> fakeredis.aioredis.FakeRedis:
    """Provide a fakeredis instance."""
    return fakeredis.aioredis.FakeRedis(decode_responses=True)


# ── Application & Client Fixtures ────────────────────────────────────────────

@pytest_asyncio.fixture
async def client(
    db_session: AsyncSession,
    fake_redis: fakeredis.aioredis.FakeRedis,
) -> AsyncGenerator[AsyncClient, None]:
    """
    Provide an httpx AsyncClient connected to the test app.
    Overrides DB and Redis dependencies.
    """
    from app.api.deps import get_db, get_redis
    from app.core.config import get_settings as _get_settings
    from app.main import create_app

    app = create_app()

    # Override dependencies
    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        async with test_session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    async def override_get_redis() -> fakeredis.aioredis.FakeRedis:
        return fake_redis

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_redis] = override_get_redis
    app.dependency_overrides[_get_settings] = get_test_settings

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac


# ── Factory Fixtures ─────────────────────────────────────────────────────────

@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession) -> dict[str, Any]:
    """Create a test user and return its data + auth token."""
    from app.models.user import User

    user_id = uuid.uuid4()
    user = User(
        id=user_id,
        email="test@example.com",
        username="testuser",
        hashed_password=hash_password("TestPass123!"),
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    token = create_access_token(
        subject=str(user.id),
        extra_claims={"email": user.email, "username": user.username},
    )

    return {
        "user": user,
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"},
    }


@pytest_asyncio.fixture
async def auth_headers(test_user: dict[str, Any]) -> dict[str, str]:
    """Convenience fixture: just the auth headers."""
    return test_user["headers"]
