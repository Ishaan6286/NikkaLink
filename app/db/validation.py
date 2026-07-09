"""
Backend database validation.

The FastAPI backend owns its own PostgreSQL schema (users, urls, clicks)
managed exclusively by Alembic. It must NOT share a database with the
Next.js frontend, which uses Prisma/NextAuth tables (accounts, sessions,
links, qr_codes, _prisma_migrations).
"""

from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# Tables that exist only in the Prisma/frontend schema.
PRISMA_MARKER_TABLES: tuple[str, ...] = (
    "_prisma_migrations",
    "accounts",
    "sessions",
    "links",
    "qr_codes",
)


class BackendDatabaseError(RuntimeError):
    """Raised when DATABASE_URL points at a frontend/Prisma database."""


async def assert_backend_database(session: AsyncSession) -> None:
    """
    Verify DATABASE_URL targets a backend-owned database.

    Raises:
        BackendDatabaseError: If Prisma marker tables or a Prisma-shaped
            ``users`` table is detected.
    """
    result = await session.execute(
        text(
            """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = ANY(:tables)
            """
        ),
        {"tables": list(PRISMA_MARKER_TABLES)},
    )
    prisma_tables = sorted(result.scalars().all())
    if prisma_tables:
        raise BackendDatabaseError(
            "DATABASE_URL points to the frontend Prisma database. "
            "The FastAPI backend requires its own independent PostgreSQL "
            f"database. Found Prisma tables: {', '.join(prisma_tables)}. "
            "Create a separate Neon database (or branch) for the backend and "
            "point DATABASE_URL at it. Alembic owns the backend schema; "
            "Prisma owns the frontend schema."
        )

    users_exists = await session.scalar(
        text(
            """
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND table_name = 'users'
            )
            """
        )
    )
    if not users_exists:
        return

    backend_users = await session.scalar(
        text(
            """
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'users'
                  AND column_name = 'hashed_password'
            )
            """
        )
    )
    if not backend_users:
        raise BackendDatabaseError(
            "A 'users' table exists but does not match the backend Alembic "
            "schema (missing hashed_password column). DATABASE_URL likely "
            "points to the frontend Prisma database. Use a separate PostgreSQL "
            "database for the FastAPI backend."
        )
