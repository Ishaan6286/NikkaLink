# =============================================================================
# Multi-stage Dockerfile for URL Shortener API (Render-compatible)
# =============================================================================
# Stage 1: Build dependencies
# Stage 2: Production-slim runtime
# =============================================================================

# ── Stage 1: Builder ────────────────────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /build

# Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# ── Stage 2: Runtime ────────────────────────────────────────────────────────
FROM python:3.12-slim AS runtime

# Security: run as non-root
RUN groupadd --gid 1001 appuser && \
    useradd --uid 1001 --gid 1001 --shell /bin/bash --create-home appuser

# Install only runtime libs
RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq5 curl && \
    rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder
COPY --from=builder /install /usr/local

WORKDIR /app
ENV PYTHONPATH=/app

# Copy application code
COPY alembic/ ./alembic/
COPY alembic.ini .
COPY app/ ./app/
COPY scripts/ ./scripts/
COPY scripts/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh && \
    chmod +x /usr/local/bin/docker-entrypoint.sh

# Switch to non-root user
USER appuser

# Render injects PORT at runtime (defaults to 8000 for local runs)
ENV PORT=8000
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD sh -c 'curl -f "http://localhost:${PORT:-8000}/health" || exit 1'

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
