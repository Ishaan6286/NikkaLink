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
    Backend <--> Redis[(Redis Cache)]
    Backend <--> DB[(PostgreSQL Database)]
```

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
   docker-compose exec web alembic upgrade head
   ```

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
1. **Database:** Managed PostgreSQL (e.g., Supabase, AWS RDS).
2. **Cache:** Managed Redis (e.g., Upstash, AWS ElastiCache).
3. **Backend:** Container orchestration (e.g., AWS ECS, Google Cloud Run, Railway, Render).
4. **Frontend:** Vercel or Netlify for Next.js hosting.

Make sure to set `ENVIRONMENT=production`, configure proper CORS origins in `.env`, and use strong `SECRET_KEY` and database passwords.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/yourusername/nikkalink/issues).

## 📄 License

This project is licensed under the MIT License.
