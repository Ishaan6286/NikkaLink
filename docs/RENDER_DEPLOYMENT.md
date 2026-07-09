# Render Deployment Checklist — NikkaLink FastAPI Backend

Use this checklist when deploying the backend to [Render](https://render.com) as a **Docker Web Service**.

## Pre-deploy

- [ ] Create a **separate Neon PostgreSQL database** (or branch) for the backend — do not reuse the frontend Prisma database
- [ ] Create an **Upstash Redis** instance and copy REST URL + token
- [ ] Generate a strong `JWT_SECRET_KEY` (32+ random bytes)
- [ ] Confirm `render.yaml` is in the repo root (optional blueprint)

## Render service settings

| Setting | Value |
|---------|-------|
| **Runtime** | Docker |
| **Dockerfile path** | `./Dockerfile` |
| **Health check path** | `/health` |
| **Plan** | Free (2 Uvicorn workers configured) |

Render automatically injects `PORT` — do not set it manually.

## Required environment variables

Set these in the Render dashboard (**Environment** tab):

| Variable | Example / notes |
|----------|-----------------|
| `ENVIRONMENT` | `production` |
| `DEBUG` | `false` |
| `DATABASE_URL` | `postgresql+asyncpg://user:pass@ep-xxx-pooler.region.aws.neon.tech/nikkalink_api?sslmode=require` |
| `JWT_SECRET_KEY` | Long random secret |
| `BASE_URL` | `https://nikkalink-api.onrender.com` (your Render service URL) |
| `PUBLIC_APP_URL` | `https://nikkalink.vercel.app` |
| `CORS_ORIGINS` | `["http://localhost:3000","https://nikkalink.vercel.app"]` |
| `UPSTASH_REDIS_REST_URL` | `https://your-instance.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token |

**Do not set** `REDIS_URL` in production unless overriding Upstash — the app builds a TLS Redis URL from Upstash credentials automatically.

**Do not set** `PORT` — Render provides it.

## What happens on deploy

The Docker entrypoint (`scripts/docker-entrypoint.sh`) runs:

1. `alembic upgrade head` — creates/updates backend schema (`users`, `urls`, `clicks`)
2. `uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 2 --proxy-headers`

## Startup behavior

| Component | Behavior if unavailable |
|-----------|-------------------------|
| **PostgreSQL** | App fails to start (required) |
| **Redis** | App starts in degraded mode; cache + rate limiting disabled |
| **Prisma DB detected** | App fails with clear error (wrong `DATABASE_URL`) |

## Post-deploy verification

Run after the service is live:

```bash
# Liveness (Render health check uses this)
curl https://YOUR-SERVICE.onrender.com/health

# Readiness (PostgreSQL + Redis status)
curl https://YOUR-SERVICE.onrender.com/ready

# CORS preflight from frontend origin
curl -I -X OPTIONS https://YOUR-SERVICE.onrender.com/api/v1/urls \
  -H "Origin: https://nikkalink.vercel.app" \
  -H "Access-Control-Request-Method: POST"
```

Expected `/health` response:

```json
{"status":"healthy","version":"1.0.0","environment":"production"}
```

Expected `/ready` when all services are up:

```json
{"status":"healthy","components":{"postgresql":{"status":"healthy",...},"redis":{"status":"healthy",...}}}
```

## Frontend configuration

Update the frontend to point at the Render API:

```
NEXT_PUBLIC_API_URL=https://YOUR-SERVICE.onrender.com
```

Redeploy the Vercel frontend after changing env vars.

## Troubleshooting

| Symptom | Likely cause |
|---------|--------------|
| `DuplicateTableError` on deploy | `DATABASE_URL` points at the Prisma/frontend database |
| `password authentication failed` | Wrong Neon credentials or database name |
| `connect() got an unexpected keyword argument 'sslmode'` | Use `postgresql+asyncpg://` or plain `postgresql://` (auto-normalized) |
| Redis degraded | Upstash credentials wrong or missing; app still runs |
| CORS errors in browser | `CORS_ORIGINS` missing frontend URL or typo |
| 502 on cold start | Free tier spin-up; wait for health check to pass |

## Local production dry-run

```bash
docker build -t nikkalink-api .
docker run --rm --env-file .env -e PORT=8000 -p 8000:8000 nikkalink-api
```

Or run the verification script:

```bash
docker run --rm --env-file .env -e PYTHONPATH=/app nikkalink-api python scripts/verify_production.py
```
