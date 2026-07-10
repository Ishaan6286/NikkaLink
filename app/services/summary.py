"""
AI summary service — on-demand link summarization via OpenAI-compatible API.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

import httpx
import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import NotFoundError, ServiceUnavailableError
from app.models.summary import PROMPT_VERSION, URLSummary
from app.repositories.metadata import MetadataRepository
from app.repositories.summary import SummaryRepository
from app.repositories.url import URLRepository
from app.services.cache import CacheService

logger = structlog.get_logger()

SYSTEM_PROMPT = (
    "You are a link intelligence assistant. Summarize the given webpage metadata "
    "concisely. Return JSON with keys: summary (2-3 sentences), key_points (array of "
    "3-5 bullet strings), reading_time_min (integer estimate), language (ISO code)."
)


class SummaryService:
    CACHE_NS = "summary"

    def __init__(self, session: AsyncSession, cache: CacheService) -> None:
        self._session = session
        self._repo = SummaryRepository(session)
        self._url_repo = URLRepository(session)
        self._meta_repo = MetadataRepository(session)
        self._cache = cache
        self._settings = get_settings()

    async def get_summary(self, url_id: uuid.UUID) -> URLSummary | None:
        return await self._repo.get_by_url_id(url_id)

    async def generate_summary(
        self,
        url_id: uuid.UUID,
        *,
        force: bool = False,
    ) -> URLSummary:
        """Generate summary on demand. Never auto-generates."""
        existing = await self._repo.get_by_url_id(url_id)
        if existing and not force:
            return existing

        if not self._settings.OPENAI_API_KEY:
            raise ServiceUnavailableError(
                "AI summarization is not configured. Set OPENAI_API_KEY on the backend."
            )

        url = await self._url_repo.get_by_id(url_id)
        if url is None:
            raise NotFoundError("URL", str(url_id))

        metadata = await self._meta_repo.get_by_url_id(url_id)
        title = metadata.title if metadata else None
        description = metadata.description if metadata else None

        content = (
            f"URL: {url.original_url}\n"
            f"Title: {title or 'Unknown'}\n"
            f"Description: {description or 'No description available'}"
        )

        result = await self._call_llm(content)

        if existing and force:
            return await self._repo.update(
                existing,
                summary=result["summary"],
                key_points=result.get("key_points"),
                reading_time_min=result.get("reading_time_min"),
                language=result.get("language"),
                generated_at=datetime.now(UTC),
                prompt_version=PROMPT_VERSION,
            )

        summary = await self._repo.create(
            url_id=url_id,
            summary=result["summary"],
            key_points=result.get("key_points"),
            reading_time_min=result.get("reading_time_min"),
            language=result.get("language"),
            generated_at=datetime.now(UTC),
            prompt_version=PROMPT_VERSION,
        )

        await self._cache.set(self.CACHE_NS, str(url_id), result, ttl=86400)
        return summary

    async def _call_llm(self, content: str) -> dict:
        base_url = self._settings.OPENAI_BASE_URL.rstrip("/")
        model = self._settings.OPENAI_MODEL

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self._settings.OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": content},
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.3,
                    "max_tokens": 600,
                },
            )
            response.raise_for_status()
            data = response.json()
            import json
            text = data["choices"][0]["message"]["content"]
            return json.loads(text)
