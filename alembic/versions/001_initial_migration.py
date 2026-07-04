"""Initial migration — create users, urls, clicks tables.

Revision ID: 001
Revises: None
Create Date: 2024-01-01 00:00:00.000000

"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Users table ──────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("username", sa.String(50), nullable=False),
        sa.Column("hashed_password", sa.String(128), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("username"),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_username", "users", ["username"])

    # ── URLs table ───────────────────────────────────────────────────────
    op.create_table(
        "urls",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("short_code", sa.String(32), nullable=False),
        sa.Column("original_url", sa.Text(), nullable=False),
        sa.Column("custom_alias", sa.String(32), nullable=True),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("tags", postgresql.ARRAY(sa.String(50)), nullable=True),
        sa.Column("total_clicks", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("short_code"),
        sa.UniqueConstraint("custom_alias"),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_urls_short_code", "urls", ["short_code"])
    op.create_index("ix_urls_owner_id", "urls", ["owner_id"])

    # ── Clicks table ─────────────────────────────────────────────────────
    op.create_table(
        "clicks",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("url_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("ip_hash", sa.String(64), nullable=False),
        sa.Column("user_agent", sa.String(512), nullable=True),
        sa.Column("browser", sa.String(100), nullable=True),
        sa.Column("device", sa.String(100), nullable=True),
        sa.Column("os", sa.String(100), nullable=True),
        sa.Column("referrer", sa.String(2048), nullable=True),
        sa.Column("country", sa.String(100), nullable=True),
        sa.Column(
            "clicked_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["url_id"], ["urls.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_clicks_url_id", "clicks", ["url_id"])
    op.create_index("ix_clicks_clicked_at", "clicks", ["clicked_at"])


def downgrade() -> None:
    op.drop_table("clicks")
    op.drop_table("urls")
    op.drop_table("users")
