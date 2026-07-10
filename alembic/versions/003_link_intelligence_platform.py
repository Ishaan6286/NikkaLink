"""Link intelligence platform — metadata, health, notes, collections, summaries, analytics.

Revision ID: 003
Revises: 002
Create Date: 2026-07-10
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── URL notes & duplicate detection ───────────────────────────────────
    op.add_column("urls", sa.Column("note_title", sa.String(200), nullable=True))
    op.add_column("urls", sa.Column("private_notes", sa.Text(), nullable=True))
    op.add_column(
        "urls",
        sa.Column("is_favorite", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.add_column(
        "urls",
        sa.Column("is_pinned", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.add_column("urls", sa.Column("color_label", sa.String(20), nullable=True))
    op.add_column("urls", sa.Column("normalized_url", sa.Text(), nullable=True))
    op.create_index("ix_urls_normalized_url", "urls", ["normalized_url"])
    op.create_index("ix_urls_owner_normalized", "urls", ["owner_id", "normalized_url"])

    # ── User profile fields ──────────────────────────────────────────────
    op.add_column("users", sa.Column("display_name", sa.String(100), nullable=True))
    op.add_column("users", sa.Column("bio", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("avatar_url", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("profile_slug", sa.String(50), nullable=True))
    op.add_column(
        "users",
        sa.Column("is_profile_public", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.add_column("users", sa.Column("theme_config", postgresql.JSONB(), nullable=True))
    op.add_column("users", sa.Column("social_links", postgresql.JSONB(), nullable=True))
    op.create_index("ix_users_profile_slug", "users", ["profile_slug"], unique=True)

    # ── Click analytics extensions ───────────────────────────────────────
    op.add_column("clicks", sa.Column("city", sa.String(100), nullable=True))
    op.add_column("clicks", sa.Column("traffic_source", sa.String(100), nullable=True))
    op.add_column(
        "clicks",
        sa.Column("is_repeat", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.create_index("ix_clicks_country", "clicks", ["country"])
    op.create_index("ix_clicks_traffic_source", "clicks", ["traffic_source"])

    # ── URL metadata ───────────────────────────────────────────────────
    op.create_table(
        "url_metadata",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("url_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("canonical_url", sa.Text(), nullable=True),
        sa.Column("title", sa.String(512), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("site_name", sa.String(256), nullable=True),
        sa.Column("og_image_url", sa.Text(), nullable=True),
        sa.Column("favicon_url", sa.Text(), nullable=True),
        sa.Column("language", sa.String(16), nullable=True),
        sa.Column("content_type", sa.String(128), nullable=True),
        sa.Column("fetched_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("fetch_error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["url_id"], ["urls.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("url_id"),
    )
    op.create_index("ix_url_metadata_url_id", "url_metadata", ["url_id"])

    # ── URL health ───────────────────────────────────────────────────────
    op.create_table(
        "url_health",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("url_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="unknown"),
        sa.Column("last_checked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("failure_reason", sa.Text(), nullable=True),
        sa.Column("response_time_ms", sa.Integer(), nullable=True),
        sa.Column("availability_pct", sa.Float(), nullable=False, server_default="100"),
        sa.Column("ssl_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("check_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("success_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("http_status_code", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["url_id"], ["urls.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("url_id"),
    )
    op.create_index("ix_url_health_url_id", "url_health", ["url_id"])
    op.create_index("ix_url_health_status", "url_health", ["status"])
    op.create_index("ix_url_health_last_checked", "url_health", ["last_checked_at"])

    # ── Collections ──────────────────────────────────────────────────────
    op.create_table(
        "collections",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("parent_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("color", sa.String(20), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_pinned", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["parent_id"], ["collections.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_collections_owner_id", "collections", ["owner_id"])
    op.create_index("ix_collections_parent_id", "collections", ["parent_id"])

    op.create_table(
        "collection_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("collection_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("url_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["collection_id"], ["collections.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["url_id"], ["urls.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("collection_id", "url_id", name="uq_collection_url"),
    )
    op.create_index("ix_collection_items_collection_id", "collection_items", ["collection_id"])
    op.create_index("ix_collection_items_url_id", "collection_items", ["url_id"])

    # ── AI summaries ─────────────────────────────────────────────────────
    op.create_table(
        "url_summaries",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("url_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("key_points", postgresql.ARRAY(sa.String(500)), nullable=True),
        sa.Column("reading_time_min", sa.Integer(), nullable=True),
        sa.Column("language", sa.String(16), nullable=True),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("prompt_version", sa.String(20), nullable=False, server_default="v1.0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["url_id"], ["urls.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("url_id"),
    )
    op.create_index("ix_url_summaries_url_id", "url_summaries", ["url_id"])

    # ── Analytics aggregates ─────────────────────────────────────────────
    op.create_table(
        "analytics_aggregates",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("url_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("aggregate_date", sa.Date(), nullable=False),
        sa.Column("total_clicks", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("unique_visitors", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("repeat_visitors", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("countries", postgresql.JSONB(), nullable=True),
        sa.Column("cities", postgresql.JSONB(), nullable=True),
        sa.Column("devices", postgresql.JSONB(), nullable=True),
        sa.Column("browsers", postgresql.JSONB(), nullable=True),
        sa.Column("operating_systems", postgresql.JSONB(), nullable=True),
        sa.Column("referrers", postgresql.JSONB(), nullable=True),
        sa.Column("hours", postgresql.JSONB(), nullable=True),
        sa.Column("weekdays", postgresql.JSONB(), nullable=True),
        sa.Column("traffic_sources", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["url_id"], ["urls.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("url_id", "aggregate_date", name="uq_url_aggregate_date"),
    )
    op.create_index("ix_analytics_aggregates_url_id", "analytics_aggregates", ["url_id"])
    op.create_index("ix_analytics_aggregates_date", "analytics_aggregates", ["aggregate_date"])


def downgrade() -> None:
    op.drop_table("analytics_aggregates")
    op.drop_table("url_summaries")
    op.drop_table("collection_items")
    op.drop_table("collections")
    op.drop_table("url_health")
    op.drop_table("url_metadata")

    op.drop_index("ix_clicks_traffic_source", "clicks")
    op.drop_index("ix_clicks_country", "clicks")
    op.drop_column("clicks", "is_repeat")
    op.drop_column("clicks", "traffic_source")
    op.drop_column("clicks", "city")

    op.drop_index("ix_users_profile_slug", "users")
    op.drop_column("users", "social_links")
    op.drop_column("users", "theme_config")
    op.drop_column("users", "is_profile_public")
    op.drop_column("users", "profile_slug")
    op.drop_column("users", "avatar_url")
    op.drop_column("users", "bio")
    op.drop_column("users", "display_name")

    op.drop_index("ix_urls_owner_normalized", "urls")
    op.drop_index("ix_urls_normalized_url", "urls")
    op.drop_column("urls", "normalized_url")
    op.drop_column("urls", "color_label")
    op.drop_column("urls", "is_pinned")
    op.drop_column("urls", "is_favorite")
    op.drop_column("urls", "private_notes")
    op.drop_column("urls", "note_title")
