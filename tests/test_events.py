"""Tests for event-driven architecture."""

from __future__ import annotations

from app.events.registry import EVENT_JOB_MAP
from app.events.types import EventType, DomainEvent
from app.workers.queue import JobStatus, JobType


class TestEventRegistry:
    def test_link_created_fires_background_jobs(self):
        jobs = EVENT_JOB_MAP[EventType.LINK_CREATED]
        job_types = {j[0] for j in jobs}
        assert JobType.FETCH_METADATA in job_types
        assert JobType.INIT_HEALTH in job_types
        assert JobType.WARM_CACHE in job_types

    def test_summary_only_on_request(self):
        assert EventType.SUMMARY_REQUESTED in EVENT_JOB_MAP
        assert EventType.LINK_CREATED not in EVENT_JOB_MAP or all(
            j[0] != JobType.GENERATE_SUMMARY
            for j in EVENT_JOB_MAP[EventType.LINK_CREATED]
        )

    def test_domain_event_serialization(self):
        event = DomainEvent(
            event_type=EventType.LINK_CREATED,
            payload={"short_code": "abc123", "url_id": "uuid"},
            correlation_id="corr-1",
        )
        d = event.to_dict()
        assert d["event_type"] == "LinkCreated"
        assert d["payload"]["short_code"] == "abc123"
        assert d["correlation_id"] == "corr-1"


class TestJobStatus:
    def test_all_statuses_defined(self):
        assert JobStatus.PENDING == "pending"
        assert JobStatus.RUNNING == "running"
        assert JobStatus.COMPLETED == "completed"
        assert JobStatus.FAILED == "failed"
        assert JobStatus.RETRYING == "retrying"
