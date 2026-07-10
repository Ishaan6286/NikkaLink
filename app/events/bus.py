"""
Internal event bus — publishes domain events and enqueues background jobs.

Events are fire-and-forget: failures in job enqueue never propagate to callers.
"""

from __future__ import annotations

import json
from typing import Any

import redis.asyncio as aioredis
import structlog

from app.events.registry import EVENT_JOB_MAP
from app.events.types import DomainEvent, EventType
from app.workers.queue import JobPriority, JobQueue

logger = structlog.get_logger()

EVENTS_CHANNEL = "urlshort:events:broadcast"


class EventBus:
  """Publishes domain events to Redis pub/sub and enqueues background jobs."""

  def __init__(
    self,
    redis_client: aioredis.Redis | None,
    job_queue: JobQueue,
  ) -> None:
    self._redis = redis_client
    self._queue = job_queue

  async def publish(self, event: DomainEvent) -> None:
    """
    Publish a domain event.

    1. Structured log (observability)
    2. Redis PUBLISH for SSE subscribers
    3. Enqueue background jobs per registry
    """
    await logger.ainfo(
      "domain_event_published",
      event_type=event.event_type,
      event_id=event.event_id,
      correlation_id=event.correlation_id,
      short_code=event.short_code,
      url_id=event.url_id,
    )

    await self._broadcast(event)

    job_specs = EVENT_JOB_MAP.get(event.event_type, [])
    for job_type, priority in job_specs:
      job_payload = {
        **event.payload,
        "event_id": event.event_id,
        "event_type": event.event_type,
        "correlation_id": event.correlation_id,
      }
      await self._queue.enqueue(
        job_type,
        job_payload,
        priority=priority,
        correlation_id=event.correlation_id,
      )

  async def publish_simple(
    self,
    event_type: EventType,
    payload: dict[str, Any],
    *,
    correlation_id: str | None = None,
  ) -> DomainEvent:
    """Convenience wrapper to build and publish an event."""
    event = DomainEvent(
      event_type=event_type,
      payload=payload,
      correlation_id=correlation_id,
    )
    await self.publish(event)
    return event

  async def _broadcast(self, event: DomainEvent) -> None:
    """Push event to Redis pub/sub for SSE clients."""
    if not self._redis:
      return
    try:
      message = json.dumps(event.to_dict(), default=str)
      await self._redis.publish(EVENTS_CHANNEL, message)

      # Per-link channel for targeted SSE
      if event.short_code:
        await self._redis.publish(
          f"urlshort:events:link:{event.short_code}",
          message,
        )
      if event.owner_id:
        await self._redis.publish(
          f"urlshort:events:user:{event.owner_id}",
          message,
        )
    except Exception as exc:
      await logger.awarning("event_broadcast_failed", error=str(exc))
