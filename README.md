# Konnio Aegis

A GRC (Governance, Risk & Compliance) SaaS platform for CISOs, built around the **CRF Governance and Risk Model (CRF-GRM)** — a structured 7-step roadmap for managing organizational security posture.

| Step | Phase | Purpose |
|------|-------|---------|
| 1 | **Initiate** | Establish the governance program and stakeholders |
| 2 | **Inventory** | Catalog assets, systems, and data flows |
| 3 | **Select** | Choose applicable controls and frameworks (NIST, ISO 27001, SOC 2, …) |
| 4 | **Educate** | Train teams on selected controls and policies |
| 5 | **Implement** | Deploy controls and document evidence |
| 6 | **Validate** | Assess control effectiveness through audits and risk assessments |
| 7 | **Communicate** | Report security posture to board, regulators, and clients |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | FastAPI, Python 3.12, Pydantic v2 |
| ORM / Migrations | SQLAlchemy 2.0, Alembic |
| Database | PostgreSQL 16 |
| Cache / Queue | Redis 7 |
| Auth | NextAuth.js (web), python-jose + passlib (API) |

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Python](https://www.python.org/) 3.12+
- [Docker](https://www.docker.com/) and Docker Compose (for the database and Redis)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/konniodev/aegis.git
cd aegis
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and replace the placeholder secrets with real values:

```bash
# Generate secure secrets
openssl rand -hex 32   # use the output for SECRET_KEY
openssl rand -hex 32   # use a different output for NEXTAUTH_SECRET
```

Also copy the same file into the API app:

```bash
cp .env apps/api/.env
```

### 3. Start the database and Redis

```bash
docker compose up -d db redis
```

This starts PostgreSQL 16 on port `5432` and Redis 7 on port `6379`.

### 4. Set up the backend

```bash
cd apps/api

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate        # Linux / macOS
.venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start the API server (http://localhost:8000)
uvicorn app.main:app --reload
```

The interactive API docs are available at `http://localhost:8000/docs`.

### 5. Set up the frontend

Open a new terminal from the repository root:

```bash
cd apps/web
npm install

# Start the dev server (http://localhost:3000)
npm run dev
```

Open `http://localhost:3000` in your browser.

## Running with Docker Compose (all services)

To run the entire stack in containers:

```bash
docker compose up -d
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API docs | http://localhost:8000/docs |

Stop all services:

```bash
docker compose down
```

Stop and remove all data volumes:

```bash
docker compose down -v
```

## Development

### Backend

```bash
# Generate a new migration after changing models
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Roll back one migration
alembic downgrade -1
```

### Frontend

```bash
npm run lint        # ESLint
npm run type-check  # TypeScript check (no emit)
npm run build       # Production build
```

## Project Structure

```
aegis/
├── apps/
│   ├── api/          # FastAPI backend
│   │   ├── app/
│   │   │   ├── models/     # SQLAlchemy ORM models
│   │   │   ├── routers/    # API route handlers
│   │   │   ├── schemas/    # Pydantic request/response schemas
│   │   │   ├── config.py   # Settings (pydantic-settings)
│   │   │   ├── database.py # DB engine and session
│   │   │   └── main.py     # App entrypoint
│   │   └── alembic/        # Database migrations
│   └── web/          # Next.js 14 frontend
│       └── app/      # App Router pages and layouts
├── packages/
│   └── shared/       # Shared TypeScript types and utilities
├── docker-compose.yml
└── .env.example
```

## License

Proprietary — © Konnio. All rights reserved.
