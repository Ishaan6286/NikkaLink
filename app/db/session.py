"""
Async SQLAlchemy engine and session factory.

Provides:
  - Configured async engine with connection pooling
  - Async session maker
  - get_db() dependency for FastAPI route injection
"""

from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import get_settings

settings = get_settings()


def _database_engine_config(database_url: str) -> tuple[str, dict]:
    """Normalize asyncpg URL and SSL options for managed Postgres hosts."""
    url = make_url(database_url)
    connect_args: dict = {}
    query = dict(url.query)

    if "sslmode" in query:
        connect_args["ssl"] = True
        query.pop("sslmode", None)
        query.pop("channel_binding", None)
        url = url.set(query=query)

    return url.render_as_string(hide_password=False), connect_args


_engine_url, _connect_args = _database_engine_config(settings.DATABASE_URL)

engine = create_async_engine(
    _engine_url,
    connect_args=_connect_args,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_timeout=settings.DB_POOL_TIMEOUT,
    pool_pre_ping=True,
    echo=settings.DEBUG,
)

async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield an async database session and ensure cleanup."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
