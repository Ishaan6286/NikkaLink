"""
Domain event types for the NikkaLink event-driven architecture.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import StrEnum
from typing import Any


class EventType(StrEnum):
  LINK_CREATED = "LinkCreated"
  LINK_VISITED = "LinkVisited"
  LINK_DELETED = "LinkDeleted"
  LINK_UPDATED = "LinkUpdated"
  LINK_EXPIRED = "LinkExpired"
  SUMMARY_REQUESTED = "SummaryRequested"
  SUMMARY_GENERATED = "SummaryGenerated"
  METADATA_FETCHED = "MetadataFetched"
  METADATA_UPDATED = "MetadataUpdated"
  HEALTH_CHECK_STARTED = "HealthCheckStarted"
  HEALTH_CHECK_COMPLETED = "HealthCheckCompleted"
  BROKEN_LINK_DETECTED = "BrokenLinkDetected"
  ANALYTICS_UPDATED = "AnalyticsUpdated"
  FOLDER_CREATED = "FolderCreated"
  FOLDER_DELETED = "FolderDeleted"
  QR_GENERATED = "QRGenerated"
  USER_REGISTERED = "UserRegistered"
  PROFILE_UPDATED = "ProfileUpdated"


@dataclass(frozen=True)
class DomainEvent:
  """Immutable domain event published to the internal event bus."""

  event_type: EventType
  payload: dict[str, Any]
  correlation_id: str | None = None
  event_id: str = field(default_factory=lambda: str(uuid.uuid4()))
  timestamp: str = field(
    default_factory=lambda: datetime.now(UTC).isoformat()
  )

  @property
  def short_code(self) -> str | None:
    return self.payload.get("short_code")

  @property
  def url_id(self) -> str | None:
    return self.payload.get("url_id")

  @property
  def owner_id(self) -> str | None:
    return self.payload.get("owner_id")

  def to_dict(self) -> dict[str, Any]:
    return {
      "event_id": self.event_id,
      "event_type": self.event_type,
      "payload": self.payload,
      "correlation_id": self.correlation_id,
      "timestamp": self.timestamp,
    }
