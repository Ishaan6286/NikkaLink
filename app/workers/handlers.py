"""
Job handlers — isolated, fault-tolerant background task execution.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

import structlog
from sqlalchemy import select

from app.db.session import async_session_factory
from app.events.bus import EventBus
from app.events.types import EventType
from app.models.url import URL
from app.services.analytics_aggregation import AnalyticsAggregationService
from app.services.cache import CacheService
from app.services.cache_invalidation import CacheInvalidationService
from app.services.health_monitor import HealthService
from app.services.metadata import MetadataService
from app.services.summary import SummaryService
from app.workers.queue import JobQueue, JobType

logger = structlog.get_logger()


async def dispatch_job(
  job: dict,
  queue: JobQueue,
  cache: CacheService,
  event_bus: EventBus | None = None,
) -> None:
  job_type = job.get("type")
  payload = job.get("payload", {})
  correlation_id = job.get("correlation_id") or payload.get("correlation_id")

  handlers = {
    JobType.FETCH_METADATA: _fetch_metadata,
    JobType.INIT_HEALTH: _init_health,
    JobType.HEALTH_CHECK: _health_check,
    JobType.GENERATE_SUMMARY: _generate_summary,
    JobType.ANALYTICS_AGGREGATE: _analytics_aggregate,
    JobType.UPDATE_ANALYTICS_CACHE: _update_analytics_cache,
    JobType.WARM_CACHE: _warm_cache,
    JobType.INVALIDATE_CACHE: _invalidate_cache,
    JobType.INDEX_SEARCH: _index_search,
    JobType.OPTIMIZE_QR: _optimize_qr,
    JobType.EXPIRED_CLEANUP: _expired_cleanup,
    JobType.CACHE_CLEANUP: _cache_cleanup,
  }

  handler = handlers.get(job_type)
  if not handler:
    await logger.awarning("unknown_job_type", job_type=job_type)
    await queue.complete(job)
    return

  try:
    await handler(payload, cache, event_bus, correlation_id)
    await queue.complete(job)
  except Exception as exc:
    await logger.aerror(
      "job_handler_failed",
      job_type=job_type,
      job_id=job.get("id"),
      error=str(exc),
      correlation_id=correlation_id,
    )
    await queue.fail(job, str(exc))


async def _fetch_metadata(
  payload: dict,
  cache: CacheService,
  event_bus: EventBus | None,
  correlation_id: str | None,
) -> None:
  url_id = uuid.UUID(payload["url_id"])
  original_url = payload["original_url"]

  async with async_session_factory() as session:
    service = MetadataService(session, cache)
    meta = await service.fetch_and_store(url_id, original_url)
    await session.commit()

  if event_bus:
    await event_bus.publish_simple(
      EventType.METADATA_FETCHED,
      {
        "url_id": str(url_id),
        "short_code": payload.get("short_code"),
        "owner_id": payload.get("owner_id"),
        "title": meta.title,
        "description": meta.description,
        "site_name": meta.site_name,
        "og_image_url": meta.og_image_url,
        "favicon_url": meta.favicon_url,
        "language": meta.language,
        "content_type": meta.content_type,
        "fetch_error": meta.fetch_error,
      },
      correlation_id=correlation_id,
    )


async def _init_health(
  payload: dict,
  cache: CacheService,
  event_bus: EventBus | None,
  correlation_id: str | None,
) -> None:
  url_id = uuid.UUID(payload["url_id"])
  original_url = payload["original_url"]

  if event_bus:
    await event_bus.publish_simple(
      EventType.HEALTH_CHECK_STARTED,
      {
        "url_id": str(url_id),
        "short_code": payload.get("short_code"),
        "owner_id": payload.get("owner_id"),
        "original_url": original_url,
      },
      correlation_id=correlation_id,
    )

  async with async_session_factory() as session:
    service = HealthService(session, cache)
    await service.get_or_create(url_id)
    await session.commit()


async def _health_check(
  payload: dict,
  cache: CacheService,
  event_bus: EventBus | None,
  correlation_id: str | None,
) -> None:
  url_id = uuid.UUID(payload["url_id"])
  original_url = payload["original_url"]

  async with async_session_factory() as session:
    service = HealthService(session, cache)
    health = await service.check_url(url_id, original_url)
    await session.commit()

  if event_bus:
    await event_bus.publish_simple(
      EventType.HEALTH_CHECK_COMPLETED,
      {
        "url_id": str(url_id),
        "short_code": payload.get("short_code"),
        "owner_id": payload.get("owner_id"),
        "status": health.status,
        "response_time_ms": health.response_time_ms,
        "availability_pct": health.availability_pct,
        "failure_reason": health.failure_reason,
      },
      correlation_id=correlation_id,
    )
    if health.status == "broken":
      await event_bus.publish_simple(
        EventType.BROKEN_LINK_DETECTED,
        {
          "url_id": str(url_id),
          "short_code": payload.get("short_code"),
          "owner_id": payload.get("owner_id"),
          "failure_reason": health.failure_reason,
        },
        correlation_id=correlation_id,
      )


async def _generate_summary(
  payload: dict,
  cache: CacheService,
  event_bus: EventBus | None,
  correlation_id: str | None,
) -> None:
  url_id = uuid.UUID(payload["url_id"])
  force = payload.get("force", False)

  async with async_session_factory() as session:
    service = SummaryService(session, cache)
    summary = await service.generate_summary(url_id, force=force)
    await session.commit()

  if event_bus:
    await event_bus.publish_simple(
      EventType.SUMMARY_GENERATED,
      {
        "url_id": str(url_id),
        "short_code": payload.get("short_code"),
        "owner_id": payload.get("owner_id"),
        "summary": summary.summary,
        "key_points": summary.key_points,
        "reading_time_min": summary.reading_time_min,
      },
      correlation_id=correlation_id,
    )


async def _analytics_aggregate(
  payload: dict,
  cache: CacheService,
  event_bus: EventBus | None,
  correlation_id: str | None,
) -> None:
  from datetime import date

  target = payload.get("target_date")
  target_date = date.fromisoformat(target) if target else None

  async with async_session_factory() as session:
    service = AnalyticsAggregationService(session, cache)
    count = await service.aggregate_all_urls(target_date)
    await session.commit()

  if event_bus:
    await event_bus.publish_simple(
      EventType.ANALYTICS_UPDATED,
      {"aggregated_urls": count},
      correlation_id=correlation_id,
    )


async def _update_analytics_cache(
  payload: dict,
  cache: CacheService,
  event_bus: EventBus | None,
  correlation_id: str | None,
) -> None:
  url_id = payload.get("url_id")
  if url_id:
    await cache.delete("analytics", str(url_id))
    await cache.delete("analytics_agg", f"dashboard:{url_id}:30")


async def _warm_cache(
  payload: dict,
  cache: CacheService,
  event_bus: EventBus | None,
  correlation_id: str | None,
) -> None:
  short_code = payload.get("short_code")
  if short_code:
    await cache.set("url", short_code, {
      "original_url": payload.get("original_url"),
      "is_active": True,
      "url_id": payload.get("url_id"),
    })


async def _invalidate_cache(
  payload: dict,
  cache: CacheService,
  event_bus: EventBus | None,
  correlation_id: str | None,
) -> None:
  invalidator = CacheInvalidationService(cache)
  await invalidator.on_link_changed(payload)


async def _index_search(
  payload: dict,
  cache: CacheService,
  event_bus: EventBus | None,
  correlation_id: str | None,
) -> None:
  short_code = payload.get("short_code")
  if short_code:
    await cache.set(
      "search",
      short_code,
      {
        "original_url": payload.get("original_url"),
        "note_title": payload.get("note_title"),
        "indexed_at": datetime.now(UTC).isoformat(),
      },
      ttl=86400,
    )


async def _optimize_qr(
  payload: dict,
  cache: CacheService,
  event_bus: EventBus | None,
  correlation_id: str | None,
) -> None:
  short_code = payload.get("short_code")
  if short_code and event_bus:
    await event_bus.publish_simple(
      EventType.QR_GENERATED,
      {"short_code": short_code, "url_id": payload.get("url_id")},
      correlation_id=correlation_id,
    )


async def _expired_cleanup(
  payload: dict,
  cache: CacheService,
  event_bus: EventBus | None,
  correlation_id: str | None,
) -> None:
  async with async_session_factory() as session:
    now = datetime.now(UTC)
    stmt = select(URL).where(
      URL.expires_at.isnot(None),
      URL.expires_at < now,
      URL.is_active.is_(True),
      URL.deleted_at.is_(None),
    )
    result = await session.execute(stmt)
    expired = result.scalars().all()
    for url in expired:
      url.is_active = False
      if event_bus:
        await event_bus.publish_simple(
          EventType.LINK_EXPIRED,
          {
            "url_id": str(url.id),
            "short_code": url.short_code,
            "owner_id": str(url.owner_id) if url.owner_id else None,
          },
        )
    await session.commit()
    await logger.ainfo("expired_links_deactivated", count=len(expired))


async def _cache_cleanup(
  payload: dict,
  cache: CacheService,
  event_bus: EventBus | None,
  correlation_id: str | None,
) -> None:
  await cache.invalidate_pattern("metadata:preview:*")
  await logger.ainfo("cache_cleanup_complete")
