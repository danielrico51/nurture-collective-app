#!/usr/bin/env bash
# Run community-service without Docker (Homebrew Postgres + Redis).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v brew >/dev/null 2>&1; then
  echo "Homebrew is required: https://brew.sh"
  exit 1
fi

if [[ ! -d .venv ]]; then
  python3.12 -m venv .venv 2>/dev/null || python3 -m venv .venv
fi
# shellcheck source=/dev/null
source .venv/bin/activate

echo "→ Installing PostgreSQL 16 and Redis (if needed)…"
brew list postgresql@16 >/dev/null 2>&1 || brew install postgresql@16
brew list redis >/dev/null 2>&1 || brew install redis

echo "→ Starting services…"
brew services start postgresql@16
brew services start redis

# Homebrew Postgres (default port 5432)
PG_BIN="$(brew --prefix postgresql@16)/bin"
export PATH="$PG_BIN:$PATH"

createdb community 2>/dev/null || true

if [[ ! -f .env ]]; then
  cp .env.example .env
fi

# Local URLs (Homebrew uses trust auth; DB role = macOS user)
LOCAL_DB_USER="$(whoami)"
LOCAL_DB_URL="postgres://${LOCAL_DB_USER}@127.0.0.1:5432/community"
if [[ -f .env ]]; then
  if grep -q '^DATABASE_URL=' .env; then
    sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=${LOCAL_DB_URL}|" .env
  else
    echo "DATABASE_URL=${LOCAL_DB_URL}" >> .env
  fi
fi

grep -q '^REDIS_URL=redis://127.0.0.1:6379/0' .env 2>/dev/null ||
  sed -i '' 's|^REDIS_URL=.*|REDIS_URL=redis://127.0.0.1:6379/0|' .env 2>/dev/null ||
  echo 'REDIS_URL=redis://127.0.0.1:6379/0' >> .env

grep -q '^CELERY_BROKER_URL=redis://127.0.0.1:6379/1' .env 2>/dev/null ||
  sed -i '' 's|^CELERY_BROKER_URL=.*|CELERY_BROKER_URL=redis://127.0.0.1:6379/1|' .env 2>/dev/null ||
  echo 'CELERY_BROKER_URL=redis://127.0.0.1:6379/1' >> .env

grep -q '^EVENTS_USE_LOCAL=true' .env || echo 'EVENTS_USE_LOCAL=true' >> .env
grep -q '^JWT_DEV_BYPASS=true' .env || echo 'JWT_DEV_BYPASS=true' >> .env

# Sync Cognito pool/client from monorepo .env.local (same as Next.js)
MONOREPO_ENV="../.env.local"
if [[ -f "$MONOREPO_ENV" ]]; then
  POOL_ID="$(grep -E '^NEXT_PUBLIC_USER_POOL_ID=' "$MONOREPO_ENV" | cut -d= -f2- | tr -d '"' || true)"
  CLIENT_ID="$(grep -E '^NEXT_PUBLIC_USER_POOL_CLIENT_ID=' "$MONOREPO_ENV" | cut -d= -f2- | tr -d '"' || true)"
  if [[ -n "$POOL_ID" ]]; then
    if grep -q '^COGNITO_USER_POOL_ID=' .env; then
      sed -i '' "s|^COGNITO_USER_POOL_ID=.*|COGNITO_USER_POOL_ID=${POOL_ID}|" .env
    else
      echo "COGNITO_USER_POOL_ID=${POOL_ID}" >> .env
    fi
  fi
  if [[ -n "$CLIENT_ID" ]]; then
    if grep -q '^COGNITO_USER_POOL_CLIENT_ID=' .env; then
      sed -i '' "s|^COGNITO_USER_POOL_CLIENT_ID=.*|COGNITO_USER_POOL_CLIENT_ID=${CLIENT_ID}|" .env
    else
      echo "COGNITO_USER_POOL_CLIENT_ID=${CLIENT_ID}" >> .env
    fi
  fi
fi

pip install -q -r requirements.txt

python manage.py migrate
python manage.py seed_communities_demo

echo ""
echo "Done. Start the API:"
echo "  source .venv/bin/activate && python manage.py runserver 8001"
echo ""
echo "In nurture-collective-app .env.local add:"
echo "  COMMUNITY_API_URL=http://localhost:8001"
