# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Security requirements
All code generated for this project must comply with the requirements in SECURITY.md. Read that file before writing any code.

## Project Overview

**Konnio Aegis** is a GRC (Governance, Risk & Compliance) SaaS platform for CISOs, built around the **CRF Governance and Risk Model (CRF-GRM)** — a 7-step roadmap:

1. **Initiate** — Establish the governance program and stakeholders
2. **Inventory** — Catalog assets, systems, and data flows
3. **Select** — Choose applicable controls and frameworks (NIST, ISO 27001, SOC 2, etc.)
4. **Educate** — Train teams on selected controls and policies
5. **Implement** — Deploy controls and document evidence
6. **Validate** — Assess control effectiveness (audits, penetration tests, risk assessments)
7. **Communicate** — Report posture to board, regulators, and clients

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | FastAPI, Python 3.12, Pydantic v2 |
| ORM / Migrations | SQLAlchemy 2.0, Alembic |
| Database | PostgreSQL 16 |
| Cache / Queue | Redis 7 |
| Auth | NextAuth.js (web), python-jose + passlib (api) |

## Development Commands

### Frontend (`apps/web`)
```bash
npm install           # install dependencies
npm run dev           # start dev server at http://localhost:3000
npm run build         # production build
npm run lint          # ESLint
npm run type-check    # TypeScript check without emitting
```

### Backend (`apps/api`)
```bash
python -m venv .venv && source .venv/bin/activate    # create virtualenv (Linux/Mac)
python -m venv .venv && .venv\Scripts\activate       # create virtualenv (Windows)
pip install -r requirements.txt                       # install deps
uvicorn app.main:app --reload                         # dev server at http://localhost:8000

# Alembic migrations
alembic revision --autogenerate -m "description"     # generate migration
alembic upgrade head                                  # apply migrations
alembic downgrade -1                                  # rollback one step
```

### Infrastructure
```bash
docker compose up -d db redis      # start only DB and Redis (for local dev)
docker compose up -d               # start all services
docker compose down -v             # stop and remove volumes
```

## Architecture

### Frontend (`apps/web`)
- Uses Next.js 14 **App Router** (`app/` directory).
- shadcn/ui components live in `components/ui/`. Add new ones with `npx shadcn-ui@latest add <component>`.
- `lib/utils.ts` exports `cn()` for className merging (clsx + tailwind-merge).
- API calls target `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8000`).

### Backend (`apps/api`)
- Entrypoint: `app/main.py` — registers routers and CORS middleware.
- `app/config.py` — all settings via `pydantic-settings`, reads from `.env`.
- `app/database.py` — SQLAlchemy engine, `SessionLocal`, `Base`, and `get_db()` FastAPI dependency.
- `app/models/` — SQLAlchemy ORM models; import new models into `alembic/env.py` so Alembic detects them.
- `app/schemas/` — Pydantic v2 request/response schemas.
- `app/routers/` — FastAPI routers, one file per domain (e.g., `assets.py`, `controls.py`). All routes are prefixed `/api/v1`.

### Shared (`packages/shared`)
Reserved for TypeScript types or utilities shared between `apps/web` and future services.

## CRF-GRM Domain Mapping

Map new features and entities to their CRF-GRM phase:

| Phase | Key Entities | Example API prefix |
|-------|-------------|-------------------|
| Initiate | Organization, Program, Stakeholder | `/api/v1/programs` |
| Inventory | Asset, DataFlow, Vendor | `/api/v1/assets` |
| Select | Framework, Control, ControlSet | `/api/v1/controls` |
| Educate | TrainingRecord, Policy, Acknowledgement | `/api/v1/training` |
| Implement | Evidence, ControlImplementation, Task | `/api/v1/evidence` |
| Validate | Assessment, Finding, RiskItem | `/api/v1/assessments` |
| Communicate | Report, Dashboard, AuditLog | `/api/v1/reports` |

## Environment Variables

Copy `.env.example` to `.env` (repo root) and to `apps/api/.env` before starting.

- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `SECRET_KEY` — JWT signing secret (generate: `openssl rand -hex 32`)
- `NEXTAUTH_SECRET` — NextAuth.js session secret
