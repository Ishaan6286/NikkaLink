#!/usr/bin/env python3
"""Verify production dependencies before Render deployment."""

from __future__ import annotations

import asyncio
import sys

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import get_settings
from app.core.redis_client import close_redis, init_redis, is_redis_available
from app.db.session import _database_engine_config


async def verify_postgresql() -> None:
    settings = get_settings()
    engine_url, connect_args = _database_engine_config(settings.DATABASE_URL)
    engine = create_async_engine(engine_url, connect_args=connect_args, pool_pre_ping=True)
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        print("OK  PostgreSQL (Neon): connected")
    finally:
        await engine.dispose()


async def verify_redis() -> None:
    await init_redis()
    if is_redis_available():
        print("OK  Redis (Upstash): connected")
    else:
        print("WARN Redis (Upstash): unavailable — app will start in degraded mode")


async def verify_cors() -> None:
    settings = get_settings()
    required = {"http://localhost:3000", "https://nikkalink.vercel.app"}
    configured = set(settings.CORS_ORIGINS)
    missing = required - configured
    if missing:
        print(f"FAIL CORS: missing origins {sorted(missing)}")
        sys.exit(1)
    print(f"OK  CORS: {settings.CORS_ORIGINS}")


async def main() -> None:
    settings = get_settings()
    print(f"Environment: {settings.ENVIRONMENT}")
    print(f"Debug: {settings.DEBUG}")
    await verify_cors()
    await verify_postgresql()
    await verify_redis()
    await close_redis()
    print("All production checks passed.")


if __name__ == "__main__":
    asyncio.run(main())
