"""
Server-Sent Events (SSE) for real-time UI updates.
"""

from __future__ import annotations

import asyncio
import json
from typing import AsyncGenerator

import structlog
from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import StreamingResponse

from app.api.deps import get_current_active_user, get_job_queue
from app.core.redis_client import get_redis as _get_redis
from app.events.bus import EVENTS_CHANNEL
from app.models.user import User
from app.workers.queue import JobQueue

logger = structlog.get_logger()

router = APIRouter(prefix="/events", tags=["Events"])


async def _sse_generator(
  request: Request,
  channels: list[str],
) -> AsyncGenerator[str, None]:
  redis_client = await _get_redis()
  if not redis_client:
    yield f"data: {json.dumps({'error': 'real-time unavailable'})}\n\n"
    return

  pubsub = redis_client.pubsub()
  try:
    await pubsub.subscribe(*channels)
    yield f"data: {json.dumps({'event_type': 'Connected', 'channels': channels})}\n\n"

    while True:
      if await request.is_disconnected():
        break

      message = await pubsub.get_message(
        ignore_subscribe_messages=True,
        timeout=1.0,
      )
      if message and message["type"] == "message":
        data = message["data"]
        if isinstance(data, bytes):
          data = data.decode("utf-8")
        yield f"data: {data}\n\n"
      else:
        # Keep-alive ping every second
        yield ": ping\n\n"
        await asyncio.sleep(0.5)
  finally:
    await pubsub.unsubscribe(*channels)
    await pubsub.aclose()


@router.get("/stream")
async def event_stream(
  request: Request,
  short_code: str | None = Query(default=None),
  current_user: User = Depends(get_current_active_user),
) -> StreamingResponse:
  """
  SSE stream for real-time link updates.

  Subscribe to user-wide events, or pass `short_code` for link-specific updates.
  """
  channels = [EVENTS_CHANNEL, f"urlshort:events:user:{current_user.id}"]
  if short_code:
    channels.append(f"urlshort:events:link:{short_code}")

  return StreamingResponse(
    _sse_generator(request, channels),
    media_type="text/event-stream",
    headers={
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  )


@router.get("/jobs/{job_id}")
async def get_job_status(
  job_id: str,
  current_user: User = Depends(get_current_active_user),
  queue: JobQueue = Depends(get_job_queue),
) -> dict:
  """Return background job status (pending / running / completed / failed / retrying)."""
  status = await queue.get_status(job_id)
  if not status:
    return {"job_id": job_id, "status": "unknown"}
  return {"job_id": job_id, **status}


@router.get("/metrics")
async def get_queue_metrics(
  current_user: User = Depends(get_current_active_user),
  queue: JobQueue = Depends(get_job_queue),
) -> dict:
  """Queue observability metrics (enqueued, completed, retried, dead-lettered)."""
  metrics = await queue.get_metrics()
  return {"queue_metrics": metrics}
