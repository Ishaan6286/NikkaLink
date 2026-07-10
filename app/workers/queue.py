"""
Production Redis-backed job queue with priority, retries, status tracking, and DLQ.
"""

from __future__ import annotations

import json
import time
import uuid
from enum import IntEnum, StrEnum
from typing import Any

import redis.asyncio as aioredis
import structlog

logger = structlog.get_logger()


class JobType(StrEnum):
  FETCH_METADATA = "fetch_metadata"
  INIT_HEALTH = "init_health"
  HEALTH_CHECK = "health_check"
  GENERATE_SUMMARY = "generate_summary"
  ANALYTICS_AGGREGATE = "analytics_aggregate"
  UPDATE_ANALYTICS_CACHE = "update_analytics_cache"
  WARM_CACHE = "warm_cache"
  INVALIDATE_CACHE = "invalidate_cache"
  INDEX_SEARCH = "index_search"
  OPTIMIZE_QR = "optimize_qr"
  EXPIRED_CLEANUP = "expired_cleanup"
  CACHE_CLEANUP = "cache_cleanup"
  SAFE_BROWSING = "safe_browsing"


class JobStatus(StrEnum):
  PENDING = "pending"
  RUNNING = "running"
  COMPLETED = "completed"
  FAILED = "failed"
  RETRYING = "retrying"


class JobPriority(IntEnum):
  HIGH = 1
  NORMAL = 5
  LOW = 10


class JobQueue:
  PREFIX = "urlshort:jobs"
  STATUS_PREFIX = "urlshort:job:status"
  DELAYED_KEY = "urlshort:jobs:delayed"
  DEAD_KEY = "urlshort:jobs:dead"
  METRICS_KEY = "urlshort:jobs:metrics"

  MAX_ATTEMPTS = 5

  def __init__(self, redis_client: aioredis.Redis | None) -> None:
    self._redis = redis_client

  @property
  def available(self) -> bool:
    return self._redis is not None

  def _queue_key(self, job_type: JobType) -> str:
    return f"{self.PREFIX}:{job_type}"

  async def enqueue(
    self,
    job_type: JobType,
    payload: dict[str, Any],
    *,
    priority: JobPriority = JobPriority.NORMAL,
    delay_seconds: int = 0,
    correlation_id: str | None = None,
  ) -> str | None:
    if not self.available:
      return None

    job_id = str(uuid.uuid4())
    job = {
      "id": job_id,
      "type": str(job_type),
      "payload": payload,
      "attempts": 0,
      "priority": priority,
      "correlation_id": correlation_id,
      "created_at": time.time(),
    }
    serialized = json.dumps(job, default=str)

    await self._set_status(job_id, JobStatus.PENDING, job_type, payload)

    if delay_seconds > 0:
      score = time.time() + delay_seconds
      await self._redis.zadd(self.DELAYED_KEY, {serialized: score})
      await self._set_status(job_id, JobStatus.RETRYING, job_type, payload)
    else:
      # Priority queue: lower score = higher priority
      score = float(priority) + time.time() / 1e12
      await self._redis.zadd(self._queue_key(job_type), {serialized: score})

    await self._incr_metric("enqueued")
    return job_id

  async def dequeue(self, job_type: JobType) -> dict | None:
    if not self.available:
      return None

    items = await self._redis.zpopmin(self._queue_key(job_type), count=1)
    if not items:
      return None

    serialized, _ = items[0]
    job = json.loads(serialized)
    await self._set_status(
      job["id"],
      JobStatus.RUNNING,
      JobType(job["type"]),
      job.get("payload", {}),
    )
    await self._incr_metric("dequeued")
    return job

  async def dequeue_delayed(self) -> dict | None:
    if not self.available:
      return None

    now = time.time()
    items = await self._redis.zrangebyscore(self.DELAYED_KEY, "-inf", now, start=0, num=1)
    if not items:
      return None

    item = items[0]
    await self._redis.zrem(self.DELAYED_KEY, item)
    job = json.loads(item)

    job_type = JobType(job["type"])
    priority = JobPriority(job.get("priority", JobPriority.NORMAL))
    score = float(priority) + time.time() / 1e12
    await self._redis.zadd(self._queue_key(job_type), {item: score})
    return None  # Will be picked up by typed consumer

  async def complete(self, job: dict) -> None:
    await self._set_status(
      job["id"],
      JobStatus.COMPLETED,
      JobType(job["type"]),
      job.get("payload", {}),
    )
    await self._incr_metric("completed")

  async def fail(self, job: dict, error: str) -> None:
    job["attempts"] = job.get("attempts", 0) + 1
    job["last_error"] = error[:500]

    if job["attempts"] >= self.MAX_ATTEMPTS:
      await self._redis.lpush(self.DEAD_KEY, json.dumps(job, default=str))
      await self._set_status(
        job["id"],
        JobStatus.FAILED,
        JobType(job["type"]),
        job.get("payload", {}),
        error=error,
      )
      await self._incr_metric("dead_lettered")
      await logger.aerror(
        "job_dead_lettered",
        job_id=job["id"],
        job_type=job["type"],
        attempts=job["attempts"],
        error=error,
      )
      return

    delay = min(300, 2 ** job["attempts"] * 5)
    serialized = json.dumps(job, default=str)
    score = time.time() + delay
    await self._redis.zadd(self.DELAYED_KEY, {serialized: score})
    await self._set_status(
      job["id"],
      JobStatus.RETRYING,
      JobType(job["type"]),
      job.get("payload", {}),
      error=error,
    )
    await self._incr_metric("retried")
    await logger.awarning(
      "job_retry_scheduled",
      job_id=job["id"],
      job_type=job["type"],
      attempt=job["attempts"],
      delay_seconds=delay,
    )

  async def get_status(self, job_id: str) -> dict | None:
    if not self.available:
      return None
    data = await self._redis.hgetall(f"{self.STATUS_PREFIX}:{job_id}")
    return data or None

  async def get_metrics(self) -> dict[str, int]:
    if not self.available:
      return {}
    raw = await self._redis.hgetall(self.METRICS_KEY)
    return {k: int(v) for k, v in raw.items()}

  async def cancel(self, job_id: str) -> bool:
    if not self.available:
      return False
    await self._set_status(job_id, JobStatus.FAILED, JobType.CACHE_CLEANUP, {}, error="cancelled")
    return True

  async def _set_status(
    self,
    job_id: str,
    status: JobStatus,
    job_type: JobType,
    payload: dict,
    *,
    error: str | None = None,
  ) -> None:
    if not self.available:
      return
    mapping = {
      "status": status,
      "type": str(job_type),
      "updated_at": str(time.time()),
      "short_code": payload.get("short_code", ""),
      "url_id": payload.get("url_id", ""),
    }
    if error:
      mapping["error"] = error[:500]
    await self._redis.hset(f"{self.STATUS_PREFIX}:{job_id}", mapping=mapping)
    await self._redis.expire(f"{self.STATUS_PREFIX}:{job_id}", 86400 * 7)

  async def _incr_metric(self, field: str) -> None:
    if not self.available:
      return
    await self._redis.hincrby(self.METRICS_KEY, field, 1)
