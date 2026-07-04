# =============================================================================
# Multi-stage Dockerfile for URL Shortener API
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

# Copy application code
COPY alembic/ ./alembic/
COPY alembic.ini .
COPY app/ ./app/

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run with production Uvicorn settings
# Workers = 2 * CPU cores + 1 (default 4 for container environments)
CMD ["python", "-m", "uvicorn", "app.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "4", \
     "--log-level", "info", \
     "--proxy-headers", \
     "--forwarded-allow-ips", "*"]
