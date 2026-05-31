# Community Service

Standalone Django service for community groups, messaging, cohorts, and AI companion — part of the `nurture-collective-app` monorepo.

**Status:** Sprint 1 complete — communities API, member app UI, local dev seed.

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

## Approved build order

1. Communities
2. Messaging
3. Cohorts
4. Analytics events
5. AI layer

## Integration TODOs

- Auth: reuse Cognito JWT from existing platform (`shared/auth` — Sprint 2)
- Onboarding: auto-cohort assignment from intake profile
- Payments: premium community gating
- Notifications: push/email (out of Phase 1)
