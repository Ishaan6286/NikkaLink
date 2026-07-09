"""
Application configuration using Pydantic Settings.

All settings are loaded from environment variables with sensible defaults
for local development. In production, set these via Docker env or .env file.
"""

from __future__ import annotations

from typing import Any
from urllib.parse import urlparse

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central application configuration."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ──────────────────────────────────────────────────────
    APP_NAME: str = "URL Shortener"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    BASE_URL: str = "http://localhost:8000"
    PUBLIC_APP_URL: str | None = None

    # ── Database ─────────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://shortener:shortener@localhost:5432/shortener"
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30

    # ── Redis ────────────────────────────────────────────────────────────
    # Leave unset in production to auto-resolve from Upstash credentials.
    REDIS_URL: str | None = None
    REDIS_CACHE_TTL: int = 300  # 5 minutes
    UPSTASH_REDIS_REST_URL: str | None = None
    UPSTASH_REDIS_REST_TOKEN: str | None = None

    # ── JWT ───────────────────────────────────────────────────────────────
    JWT_SECRET_KEY: str = "CHANGE-THIS-TO-A-LONG-RANDOM-SECRET-KEY"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── CORS ─────────────────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:8000"]

    # ── Rate Limiting ────────────────────────────────────────────────────
    RATE_LIMIT_ANONYMOUS: int = 30
    RATE_LIMIT_AUTHENTICATED: int = 120
    RATE_LIMIT_WINDOW_SECONDS: int = 60

    # ── Short Code ───────────────────────────────────────────────────────
    SHORT_CODE_LENGTH: int = 7

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            import json

            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"

    @property
    def public_app_url(self) -> str:
        base_url = self.PUBLIC_APP_URL or self.BASE_URL
        return base_url.rstrip("/")

    @property
    def resolved_redis_url(self) -> str | None:
        """
        Resolve the Redis connection URL.

        Priority:
          1. Explicit REDIS_URL (e.g. local Docker Redis)
          2. Upstash REST credentials → TLS Redis protocol URL
          3. Localhost default in development only

        Upstash REST credentials are converted to ``rediss://`` because the
        cache and rate limiter require the Redis protocol (pipelines, sorted
        sets), not the Upstash HTTP REST API.
        """
        if self.REDIS_URL:
            return self.REDIS_URL

        if self.UPSTASH_REDIS_REST_URL and self.UPSTASH_REDIS_REST_TOKEN:
            host = urlparse(self.UPSTASH_REDIS_REST_URL).hostname
            if host:
                return (
                    f"rediss://default:{self.UPSTASH_REDIS_REST_TOKEN}@{host}:6379"
                )

        if self.is_development:
            return "redis://localhost:6379/0"

        return None


# Singleton settings instance
_settings: Settings | None = None


def get_settings() -> Settings:
    """Get cached settings instance."""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
