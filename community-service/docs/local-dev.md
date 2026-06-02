# Community Service — Local Development

---

## Prerequisites

| Tool | Version |
|------|---------|
| Docker | 24+ |
| Docker Compose | v2 |
| Python | 3.12+ (optional — for IDE/type checking outside Docker) |

---

## First-time setup

```bash
# From monorepo root
cd community-service

# Environment
cp .env.example .env
# Edit .env if needed (defaults work for local Docker)

# Start infrastructure + app
docker compose up -d

# Wait for Postgres healthy, then migrate (after Sprint 1+)
docker compose exec app python manage.py migrate

# Optional: seed demo communities (Sprint 1+)
docker compose exec app python manage.py seed_communities_demo
docker compose exec app python manage.py seed_communities_demo --with-users --join-demo
```

---

## Services (Docker Compose)

| Service | Host port | Purpose |
|---------|-----------|---------|
| `app` | 8001 | Django REST + Channels ASGI |
| `db` | 5433 | PostgreSQL 16 |
| `redis` | 6380 | Channel layer + Celery broker |
| `worker` | — | Celery worker (Sprint 4+) |

---

## URLs

| Endpoint | URL |
|----------|-----|
| Health | http://localhost:8001/health/ |
| API base | http://localhost:8001/api/v1/ |
| WebSocket | ws://localhost:8001/ws/messaging/{channel_id}/ |
| Admin (dev) | http://localhost:8001/admin/ |

---

## Running without Docker (optional)

```bash
cd community-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Start Postgres + Redis separately, then:
export DATABASE_URL=postgres://community:community@localhost:5433/community
export REDIS_URL=redis://localhost:6380/0
export EVENTS_USE_LOCAL=true

python manage.py migrate
python manage.py runserver 8001
# Separate terminal for ASGI/WebSocket (Sprint 2+):
daphne -b 0.0.0.0 -p 8002 community_platform.asgi:application
```

---

## Environment variables

See `.env.example`. Key vars:

| Variable | Default (local) | Purpose |
|----------|-----------------|---------|
| `DATABASE_URL` | postgres://community:community@db:5432/community | Operational DB |
| `REDIS_URL` | redis://redis:6379/0 | Channels + Celery |
| `NURTURE_EVENTS_BUCKET` | — | S3 bucket (optional local) |
| `EVENTS_USE_LOCAL` | `true` | Write events to `.data/events/` |
| `ENABLE_COMMUNITIES` | `true` | Feature flag |
| `ENABLE_GROUP_CHAT` | `true` | Feature flag |
| `ENABLE_COHORTS` | `false` | Feature flag |
| `ENABLE_AI` | `false` | Feature flag |
| `COGNITO_USER_POOL_ID` | from main app | JWT validation |
| `JWT_DEV_BYPASS` | `true` (local only) | Accept dev tokens — remove in prod |

---

## Auth (local dev)

**Sprint 0–1:** `JWT_DEV_BYPASS=true` accepts header:

```
Authorization: Bearer dev:parent:550e8400-e29b-41d4-a716-446655440000
```

Format: `dev:{platform_role}:{user_uuid}`

**Production / staging:** Set `JWT_DEV_BYPASS=false` and the same `COGNITO_USER_POOL_ID` / `COGNITO_USER_POOL_CLIENT_ID` as the Next.js app. The member proxy forwards Cognito **ID tokens** unchanged.

**Sprint 2+:** Optionally extract JWT helpers to `shared/auth/`.

---

## Running tests

```bash
docker compose exec app pytest
# or
docker compose exec app pytest tests/communities/ -v
```

---

## Logs

```bash
docker compose logs -f app
docker compose logs -f worker
```

---

## Monorepo integration

| Path | Relationship |
|------|--------------|
| `frontend/` (Next.js) | Calls `http://localhost:8001/api/v1/` — community app at `/apps/community` |
| `backend/` | Platform API — future webhook to `POST /cohorts/assign/` |
| `shared/auth/` | Shared Cognito JWT utilities (TODO) |
| `infrastructure/aws/` | S3 bucket `NURTURE_EVENTS_BUCKET` provisioning |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `connection refused` to db | Wait for healthcheck: `docker compose ps` |
| Migrations fail | Ensure Sprint 1 models exist; `migrate users` first |
| WebSocket 403 | Pass JWT as query param `?token=` |
| S3 errors locally | Set `EVENTS_USE_LOCAL=true` |
| Port conflict | Change `8001`, `5433`, `6380` in `docker-compose.yml` |
