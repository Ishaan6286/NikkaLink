"""
Link health monitoring service — runs outside request lifecycle.
"""

from __future__ import annotations

import socket
import ssl
import time
import uuid
from datetime import UTC, datetime
from urllib.parse import urlparse

import httpx
import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.health import HealthStatus, URLHealth
from app.repositories.health import HealthRepository
from app.repositories.url import URLRepository
from app.services.cache import CacheService
from app.utils.url_safety import validate_external_url

logger = structlog.get_logger()


class HealthService:
    CACHE_NS = "health"

    def __init__(self, session: AsyncSession, cache: CacheService) -> None:
        self._session = session
        self._repo = HealthRepository(session)
        self._url_repo = URLRepository(session)
        self._cache = cache

    async def get_or_create(self, url_id: uuid.UUID) -> URLHealth:
        health = await self._repo.get_by_url_id(url_id)
        if health:
            return health
        return await self._repo.create(
            url_id=url_id,
            status=HealthStatus.UNKNOWN,
            availability_pct=100.0,
        )

    async def check_url(self, url_id: uuid.UUID, original_url: str) -> URLHealth:
        """Perform a health check on a URL. Never called during user requests."""
        health = await self.get_or_create(url_id)
        start = time.monotonic()
        status = HealthStatus.HEALTHY
        failure_reason: str | None = None
        http_status: int | None = None
        ssl_expires_at: datetime | None = None

        try:
            safe_url = validate_external_url(original_url)
            timeout = httpx.Timeout(15.0, connect=5.0)
            seen_urls: set[str] = set()

            async with httpx.AsyncClient(
                follow_redirects=False,
                timeout=timeout,
            ) as client:
                current_url = safe_url
                redirects = 0
                while redirects < 10:
                    if current_url in seen_urls:
                        status = HealthStatus.BROKEN
                        failure_reason = "Redirect loop detected"
                        break
                    seen_urls.add(current_url)

                    response = await client.get(
                        current_url,
                        headers={"User-Agent": "NikkaLink-HealthCheck/1.0"},
                    )
                    http_status = response.status_code

                    if response.status_code in {301, 302, 303, 307, 308}:
                        location = response.headers.get("location")
                        if not location:
                            status = HealthStatus.WARNING
                            failure_reason = "Redirect without Location header"
                            break
                        current_url = str(response.url.join(location))
                        redirects += 1
                        continue

                    if response.status_code >= 500:
                        status = HealthStatus.BROKEN
                        failure_reason = f"Server error {response.status_code}"
                    elif response.status_code == 404:
                        status = HealthStatus.BROKEN
                        failure_reason = "Page not found (404)"
                    elif response.status_code >= 400:
                        status = HealthStatus.WARNING
                        failure_reason = f"Client error {response.status_code}"
                    break

            # SSL expiry check for HTTPS URLs
            parsed = urlparse(original_url)
            if parsed.scheme == "https" and parsed.hostname:
                ssl_expires_at = self._check_ssl_expiry(parsed.hostname, parsed.port or 443)
                if ssl_expires_at:
                    days_left = (ssl_expires_at - datetime.now(UTC)).days
                    if days_left < 7:
                        status = HealthStatus.BROKEN
                        failure_reason = f"SSL certificate expires in {days_left} days"
                    elif days_left < 30:
                        status = HealthStatus.WARNING
                        failure_reason = f"SSL certificate expires in {days_left} days"

        except httpx.TimeoutException:
            status = HealthStatus.BROKEN
            failure_reason = "Request timed out"
        except httpx.ConnectError:
            status = HealthStatus.BROKEN
            failure_reason = "DNS or connection failure"
        except Exception as exc:
            status = HealthStatus.BROKEN
            failure_reason = str(exc)[:500]

        elapsed_ms = int((time.monotonic() - start) * 1000)
        check_count = health.check_count + 1
        success_count = health.success_count + (1 if status == HealthStatus.HEALTHY else 0)
        availability = round((success_count / check_count) * 100, 2)

        updated = await self._repo.update(
            health,
            status=status,
            last_checked_at=datetime.now(UTC),
            failure_reason=failure_reason,
            response_time_ms=elapsed_ms,
            availability_pct=availability,
            ssl_expires_at=ssl_expires_at,
            check_count=check_count,
            success_count=success_count,
            http_status_code=http_status,
        )

        await self._cache.set(
            self.CACHE_NS,
            str(url_id),
            {
                "status": status,
                "last_checked_at": updated.last_checked_at.isoformat() if updated.last_checked_at else None,
                "failure_reason": failure_reason,
                "response_time_ms": elapsed_ms,
                "availability_pct": availability,
            },
            ttl=3600,
        )

        await logger.ainfo(
            "health_check_complete",
            url_id=str(url_id),
            status=status,
            response_time_ms=elapsed_ms,
        )
        return updated

    @staticmethod
    def _check_ssl_expiry(hostname: str, port: int) -> datetime | None:
        try:
            context = ssl.create_default_context()
            with socket.create_connection((hostname, port), timeout=5) as sock:
                with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                    cert = ssock.getpeercert()
                    if cert and "notAfter" in cert:
                        from email.utils import parsedate_to_datetime
                        return parsedate_to_datetime(cert["notAfter"])
        except Exception:
            return None
        return None

    async def get_health(self, url_id: uuid.UUID) -> URLHealth:
        health = await self._repo.get_by_url_id(url_id)
        if health is None:
            return await self.get_or_create(url_id)
        return health

    async def get_due_checks(self, limit: int = 50) -> list[tuple[uuid.UUID, str]]:
        """Return (url_id, original_url) pairs due for health checking."""
        records = await self._repo.get_due_for_check(limit=limit)
        results: list[tuple[uuid.UUID, str]] = []
        for record in records:
            url = await self._url_repo.get_by_id(record.url_id)
            if url and not url.is_deleted:
                results.append((url.id, url.original_url))
        return results
