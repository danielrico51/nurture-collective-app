# Community Service

Standalone Django service for community groups, messaging, cohorts, and AI companion — part of the `nurture-collective-app` monorepo.

**Status:** Sprint 1–3 — communities, messaging, cohorts (assignment + recommendations); member app UI.

## Architecture (Communities member app)

End-to-end design for the **Apps → Community** experience (Next.js proxy, Cognito, env-scoped posts, S3 uploads, production EC2/RDS):

**[docs/communities-app.md](docs/communities-app.md)**

## Quick start (Docker)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) or `brew install --cask docker`, then open Docker so `docker` is on your PATH.

```bash
cd community-service
cp .env.example .env
docker compose up -d
docker compose exec app python manage.py migrate
docker compose exec app python manage.py seed_communities_demo
```

## Quick start (no Docker — Homebrew)

If you see `zsh: command not found: docker`, use Postgres + Redis from Homebrew instead:

```bash
cd community-service
chmod +x scripts/setup-local-no-docker.sh
./scripts/setup-local-no-docker.sh
source .venv/bin/activate
python manage.py runserver 8001
```

See [docs/local-dev.md](docs/local-dev.md) for details.

In the monorepo root `.env.local`:

```
COMMUNITY_API_URL=http://localhost:8001
```

Then run `npm run dev`, sign in, and open **Apps → Community**.

Health: `GET http://localhost:8001/health/`

Optional demo users:

```bash
docker compose exec app python manage.py seed_communities_demo --with-users --join-demo
```

After migrations, backfill discussion channels for existing communities:

```bash
python manage.py seed_community_channels
```

Reset all posts, comments, reactions, and channel messages (keeps communities and memberships):

```bash
python manage.py purge_community_feed --dry-run   # preview counts
python manage.py purge_community_feed --yes     # non-interactive purge
```

Run with ASGI for WebSocket support:

```bash
daphne -b 0.0.0.0 -p 8001 community_platform.asgi:application
```

(`runserver` works for REST; use **daphne** for live chat.)

## Approved build order

1. Communities ✓
2. Messaging ✓
3. Cohorts (API + assignment + member UI; set `ENABLE_COHORTS=true` locally)
4. Analytics events
5. AI layer

**Next implementation plan (Communities app):** [docs/communities-implementation-plan.md](docs/communities-implementation-plan.md)

## Auth (Cognito)

The Next.js proxy at `/api/community/*` forwards the member's Cognito **ID token** to this service. Configure the same pool and app client as the main app:

| Variable | Next.js equivalent |
|----------|-------------------|
| `COGNITO_USER_POOL_ID` | `NEXT_PUBLIC_USER_POOL_ID` |
| `COGNITO_USER_POOL_CLIENT_ID` | `NEXT_PUBLIC_USER_POOL_CLIENT_ID` |
| `COGNITO_ADMIN_GROUP` | `MANAGEMENT_COGNITO_GROUP` (default `admin`) |

Set `JWT_DEV_BYPASS=false` in staging/production.

## Integration TODOs

- Auth: optional extract to `shared/auth/` (Cognito validation is implemented in `users/auth/cognito_provider.py`)
- Onboarding: auto-cohort assignment from intake profile
- Payments: premium community gating
- Notifications: push/email (out of Phase 1)
