"""
Background worker scheduler — starts isolated consumer loops at app startup.
"""

from __future__ import annotations

import asyncio

import structlog

from app.core.config import get_settings
from app.core.redis_client import get_redis
from app.events.bus import EventBus
from app.services.cache import CacheService
from app.workers.consumers import (
  WORKER_GROUPS,
  _analytics_scheduler,
  _consumer_loop,
  _delayed_job_promoter,
  _health_scheduler,
)
from app.workers.queue import JobQueue

logger = structlog.get_logger()

_worker_tasks: list[asyncio.Task] = []


async def start_background_workers() -> list[asyncio.Task]:
  settings = get_settings()
  if not settings.ENABLE_BACKGROUND_WORKERS:
    await logger.ainfo("background_workers_disabled")
    return []

  redis_client = await get_redis()
  cache = CacheService(redis_client)
  queue = JobQueue(redis_client)
  event_bus = EventBus(redis_client, queue)

  poll = settings.METADATA_QUEUE_POLL_SECONDS
  tasks: list[asyncio.Task] = []

  # Specialized worker consumers
  for name, job_types in WORKER_GROUPS.items():
    tasks.append(
      asyncio.create_task(
        _consumer_loop(name, job_types, queue, cache, event_bus, poll),
        name=f"worker_{name}",
      )
    )

  # Delayed / retry job promoter
  tasks.append(
    asyncio.create_task(
      _delayed_job_promoter(queue, poll),
      name="worker_delayed_promoter",
    )
  )

  # Periodic schedulers
  tasks.append(
    asyncio.create_task(
      _health_scheduler(queue, cache, settings.HEALTH_CHECK_INTERVAL_SECONDS),
      name="scheduler_health",
    )
  )
  tasks.append(
    asyncio.create_task(
      _analytics_scheduler(queue, settings.ANALYTICS_AGGREGATION_INTERVAL_SECONDS),
      name="scheduler_analytics",
    )
  )

  global _worker_tasks
  _worker_tasks = tasks
  await logger.ainfo("background_workers_started", count=len(tasks))
  return tasks


async def stop_background_workers() -> None:
  for task in _worker_tasks:
    task.cancel()
  if _worker_tasks:
    await asyncio.gather(*_worker_tasks, return_exceptions=True)
  await logger.ainfo("background_workers_stopped")
