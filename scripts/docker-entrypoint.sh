#!/bin/sh
set -e

PORT="${PORT:-8000}"

echo "Running database migrations..."
alembic upgrade head

echo "Starting Uvicorn on port ${PORT}..."
exec python -m uvicorn app.main:app \
    --host 0.0.0.0 \
    --port "${PORT}" \
    --workers 2 \
    --log-level info \
    --proxy-headers \
    --forwarded-allow-ips "*"
