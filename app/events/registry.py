"""
Maps domain events to background job types.
"""

from __future__ import annotations

from app.events.types import EventType
from app.workers.queue import JobPriority, JobType

# Event → list of (job_type, priority) tuples fired AFTER the HTTP response.
EVENT_JOB_MAP: dict[EventType, list[tuple[JobType, JobPriority]]] = {
  EventType.LINK_CREATED: [
    (JobType.FETCH_METADATA, JobPriority.HIGH),
    (JobType.INIT_HEALTH, JobPriority.NORMAL),
    (JobType.WARM_CACHE, JobPriority.NORMAL),
    (JobType.INDEX_SEARCH, JobPriority.LOW),
    (JobType.OPTIMIZE_QR, JobPriority.LOW),
  ],
  EventType.LINK_VISITED: [
    (JobType.UPDATE_ANALYTICS_CACHE, JobPriority.NORMAL),
  ],
  EventType.LINK_DELETED: [
    (JobType.INVALIDATE_CACHE, JobPriority.HIGH),
    (JobType.INDEX_SEARCH, JobPriority.LOW),
  ],
  EventType.LINK_UPDATED: [
    (JobType.INVALIDATE_CACHE, JobPriority.HIGH),
    (JobType.INDEX_SEARCH, JobPriority.LOW),
  ],
  EventType.LINK_EXPIRED: [
    (JobType.INVALIDATE_CACHE, JobPriority.HIGH),
  ],
  EventType.SUMMARY_REQUESTED: [
    (JobType.GENERATE_SUMMARY, JobPriority.HIGH),
  ],
  EventType.HEALTH_CHECK_STARTED: [
    (JobType.HEALTH_CHECK, JobPriority.HIGH),
  ],
  EventType.FOLDER_CREATED: [
    (JobType.INVALIDATE_CACHE, JobPriority.NORMAL),
  ],
  EventType.FOLDER_DELETED: [
    (JobType.INVALIDATE_CACHE, JobPriority.NORMAL),
  ],
  EventType.PROFILE_UPDATED: [
    (JobType.INVALIDATE_CACHE, JobPriority.NORMAL),
  ],
  EventType.USER_REGISTERED: [
    (JobType.WARM_CACHE, JobPriority.LOW),
  ],
}
