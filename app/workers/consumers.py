"""
Specialized background worker consumers — isolated from the API process.
"""

from __future__ import annotations

import asyncio

import structlog

from app.core.config import get_settings
from app.events.bus import EventBus
from app.services.cache import CacheService
from app.workers.handlers import dispatch_job
from app.workers.queue import JobQueue, JobType

logger = structlog.get_logger()

# Worker groups: each consumer loop only processes its assigned job types.
WORKER_GROUPS: dict[str, list[JobType]] = {
  "metadata": [JobType.FETCH_METADATA],
  "health": [JobType.INIT_HEALTH, JobType.HEALTH_CHECK],
  "analytics": [JobType.ANALYTICS_AGGREGATE, JobType.UPDATE_ANALYTICS_CACHE],
  "summary": [JobType.GENERATE_SUMMARY],
  "cache": [JobType.WARM_CACHE, JobType.INVALIDATE_CACHE, JobType.CACHE_CLEANUP],
  "search": [JobType.INDEX_SEARCH, JobType.OPTIMIZE_QR],
  "cleanup": [JobType.EXPIRED_CLEANUP],
}


async def _consumer_loop(
  name: str,
  job_types: list[JobType],
  queue: JobQueue,
  cache: CacheService,
  event_bus: EventBus,
  poll_seconds: float,
) -> None:
  """Dedicated consumer for a worker group."""
  await logger.ainfo("worker_started", worker=name, job_types=[str(t) for t in job_types])

  while True:
    try:
      processed = False
      for job_type in job_types:
        job = await queue.dequeue(job_type)
        if job:
          await dispatch_job(job, queue, cache, event_bus)
          processed = True
          break

      if not processed:
        await asyncio.sleep(poll_seconds)
    except asyncio.CancelledError:
      await logger.ainfo("worker_stopped", worker=name)
      break
    except Exception as exc:
      await logger.aerror("worker_error", worker=name, error=str(exc))
      await asyncio.sleep(5)


async def _delayed_job_promoter(queue: JobQueue, poll_seconds: float) -> None:
  """Move delayed/retry jobs back into their priority queues."""
  while True:
    try:
      await queue.dequeue_delayed()
      await asyncio.sleep(poll_seconds)
    except asyncio.CancelledError:
      break
    except Exception as exc:
      await logger.aerror("delayed_promoter_error", error=str(exc))
      await asyncio.sleep(5)


async def _health_scheduler(queue: JobQueue, cache: CacheService, interval: int) -> None:
  from app.db.session import async_session_factory
  from app.services.health_monitor import HealthService

  while True:
    try:
      async with async_session_factory() as session:
        service = HealthService(session, cache)
        due = await service.get_due_checks(limit=50)
        for url_id, original_url in due:
          await queue.enqueue(
            JobType.HEALTH_CHECK,
            {"url_id": str(url_id), "original_url": original_url},
          )
        await session.commit()
      await asyncio.sleep(interval)
    except asyncio.CancelledError:
      break
    except Exception as exc:
      await logger.aerror("health_scheduler_error", error=str(exc))
      await asyncio.sleep(60)


async def _analytics_scheduler(queue: JobQueue, interval: int) -> None:
  while True:
    try:
      await queue.enqueue(JobType.ANALYTICS_AGGREGATE, {})
      await queue.enqueue(JobType.EXPIRED_CLEANUP, {})
      await queue.enqueue(JobType.CACHE_CLEANUP, {})
      await asyncio.sleep(interval)
    except asyncio.CancelledError:
      break
    except Exception as exc:
      await logger.aerror("analytics_scheduler_error", error=str(exc))
      await asyncio.sleep(300)
