"""Backward-compatible re-exports."""

from app.workers.handlers import dispatch_job as process_job

__all__ = ["process_job"]
