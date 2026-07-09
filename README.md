# NikkaLink

<div align="center">
  <img src="frontend/public/logo.png" alt="NikkaLink Logo" width="120" />
  <h3>Short Links. Smarter Connections.</h3>
  <p>A premium, open-source URL management platform built for modern teams.</p>
</div>

---

## 🚀 Product Overview

**NikkaLink** is a production-ready, high-performance URL shortener and link management platform. It provides instant link shortening, custom aliases, QR code generation, and rich analytics with tracking for clicks, unique visitors, browser types, devices, and referrers.

Built with an asynchronous FastAPI backend and a Next.js 15 frontend, NikkaLink is designed for scale, speed, and a premium user experience.

## ✨ Features

- **Link Management:** Shorten long URLs, create custom aliases, and set expiration dates.
- **Rich Analytics:** Track total clicks, unique visitors, devices, browsers, and top referrers with beautiful Recharts visualizations.
- **QR Codes:** Downloadable QR codes for every link you generate.
- **Secure Authentication:** JWT-based auth with refresh token rotation and bcrypt password hashing.
- **High Performance:** Sub-millisecond URL resolution using Redis caching and asynchronous PostgreSQL operations.
- **Developer API:** Fully documented REST API for programmatic link management.
- **Premium Dashboard:** A beautiful, responsive, minimal UI built with Next.js 15, Tailwind CSS, and shadcn/ui.

## 🛠️ Tech Stack

**Backend**
- Python 3.12
- FastAPI
- PostgreSQL (Asyncpg)
- SQLAlchemy 2.0 & Alembic
- Redis (Caching & Rate Limiting)
- JWT Authentication

**Frontend**
- Next.js 15 (App Router)
- React 19 & TypeScript
- Tailwind CSS
- shadcn/ui & Radix UI
- TanStack Query (React Query)
- Recharts (Analytics)
- Framer Motion (Animations)

**Infrastructure**
- Docker & Docker Compose
- GitHub Actions (CI)

## 🏗️ Architecture

```mermaid
graph TD
    Client[Client (Browser/Mobile)] --> Frontend[Next.js Frontend (Port 3000)]
    Client -->|API Requests / Redirects| Backend[FastAPI Backend (Port 8000)]
    Frontend -->|API Requests| Backend
    Frontend --> FrontendDB[(Frontend PostgreSQL — Prisma/NextAuth)]
    Backend <--> Redis[(Redis Cache)]
    Backend <--> BackendDB[(Backend PostgreSQL — Alembic)]
```

### Database separation

The frontend and backend each have their **own PostgreSQL database**:

| Service | ORM / migrations | Tables |
|---------|------------------|--------|
| **Next.js frontend** | Prisma | `users`, `accounts`, `sessions`, `links`, `qr_codes`, `_prisma_migrations` |
| **FastAPI backend** | Alembic | `users`, `urls`, `clicks`, `alembic_version` |

Do not point both `DATABASE_URL` values at the same database. Sharing a database causes `DuplicateTableError` when Alembic tries to create tables that Prisma already owns.

For production on Neon, create a **separate database or branch** for the backend (e.g. `nikkalink_api`) and set the backend `DATABASE_URL` to that database only.

## 📦 Installation & Setup (Docker)

NikkaLink is fully containerized. You can run the entire stack (Backend, Frontend, PostgreSQL, Redis) using Docker Compose.

### Prerequisites
- Docker & Docker Compose installed.
- Node.js 20+ (for local frontend development).
- Python 3.12 (for local backend development).

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/nikkalink.git
   cd nikkalink
   ```

2. **Configure Environment Variables:**
   Copy the example environment files.
   ```bash
   cp .env.example .env
   cp frontend/.env.local.example frontend/.env.local
   ```
   *(Update the `.env` values as needed, especially `SECRET_KEY`)*

3. **Run with Docker Compose:**
   ```bash
   docker-compose up -d --build
   ```

4. **Run Database Migrations:**
   ```bash
   docker-compose exec api alembic upgrade head
   ```
   Migrations run automatically on Render via the Docker entrypoint. They target the **backend** database only.

The application will now be available at:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **Interactive API Docs (Swagger):** http://localhost:8000/docs

## 📖 API Documentation

NikkaLink provides a robust REST API. Once the backend is running, navigate to `http://localhost:8000/docs` to view the interactive Swagger documentation.

### Core Endpoints:
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Authenticate and receive JWT tokens
- `POST /api/v1/urls` - Create a new short link
- `GET /api/v1/urls` - List all your links
- `GET /api/v1/urls/{short_code}/analytics` - Retrieve analytics for a link
- `GET /{short_code}` - Public redirect endpoint

## 🚀 Deployment Guide

For production deployment, we recommend:
1. **Frontend database:** Managed PostgreSQL for Prisma/NextAuth (e.g. Neon) — set `DATABASE_URL` in `frontend/.env`.
2. **Backend database:** A **separate** managed PostgreSQL instance for Alembic (e.g. a second Neon database or branch) — set `DATABASE_URL` in the backend `.env` / Render env vars.
3. **Cache:** Managed Redis (e.g. Upstash, AWS ElastiCache).
4. **Backend:** Container orchestration (e.g. Render, Railway, AWS ECS).
5. **Frontend:** Vercel or Netlify for Next.js hosting.

### Backend environment variables (Render)

| Variable | Required | Description |
|----------|----------|-------------|
| `ENVIRONMENT` | Yes | Set to `production`. |
| `DEBUG` | Yes | Set to `false`. |
| `DATABASE_URL` | Yes | Backend-only PostgreSQL URL (`postgresql+asyncpg://...?sslmode=require`). Must **not** be the frontend Prisma database. |
| `JWT_SECRET_KEY` | Yes | Long random secret for signing API access/refresh tokens. |
| `BASE_URL` | Yes | Public URL of the FastAPI service (e.g. `https://nikkalink-api.onrender.com`). |
| `PUBLIC_APP_URL` | Yes | Public URL of the Next.js frontend (used when building short-link URLs). |
| `CORS_ORIGINS` | Yes | JSON array of allowed frontend origins. |
| `UPSTASH_REDIS_REST_URL` | Recommended | Upstash REST endpoint for cache and rate limiting. |
| `UPSTASH_REDIS_REST_TOKEN` | Recommended | Upstash REST token. Omit `REDIS_URL` in production to auto-resolve from these. |
| `REDIS_URL` | Optional | Explicit Redis URL; overrides Upstash when set (local Docker only). |
| `REDIS_CACHE_TTL` | Optional | Cache TTL in seconds (default `300`). |
| `JWT_ALGORITHM` | Optional | Default `HS256`. |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Optional | Default `30`. |
| `JWT_REFRESH_TOKEN_EXPIRE_DAYS` | Optional | Default `7`. |
| `RATE_LIMIT_ANONYMOUS` | Optional | Requests per window for anonymous users (default `30`). |
| `RATE_LIMIT_AUTHENTICATED` | Optional | Requests per window for authenticated users (default `120`). |
| `RATE_LIMIT_WINDOW_SECONDS` | Optional | Rate limit window (default `60`). |
| `SHORT_CODE_LENGTH` | Optional | Generated short code length (default `7`). |
| `PORT` | Auto | Injected by Render; do not set manually. |

Make sure to set `ENVIRONMENT=production`, configure proper CORS origins, and use strong `JWT_SECRET_KEY` and database passwords.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/yourusername/nikkalink/issues).

## 📄 License

This project is licensed under the MIT License.
