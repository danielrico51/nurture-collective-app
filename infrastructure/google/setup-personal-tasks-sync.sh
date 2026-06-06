#!/usr/bin/env bash
# Personal Google Tasks sync — CLI setup (team board + per-user Google mirror).
#
# Automates via CLI:
#   - GCP Tasks API enablement
#   - .env.local update (personal sync mode)
#   - Amplify env vars
#   - Optional Amplify redeploy
#
# OAuth Web client cannot be created via gcloud — pass credentials or run interactively:
#   export GOOGLE_TASKS_OAUTH_CLIENT_ID='....apps.googleusercontent.com'
#   export GOOGLE_TASKS_OAUTH_CLIENT_SECRET='....'
#   ./infrastructure/google/setup-personal-tasks-sync.sh
#
# Optional:
#   PROJECT_ID=boxwood-magnet-498623-n4
#   AMPLIFY_APP_ID=d9588bqvrp5xs
#   LOCAL_APP_URL=http://localhost:3000
#   AMPLIFY_APP_URL=https://dev.d9588bqvrp5xs.amplifyapp.com
#   REDEPLOY_AMPLIFY=true

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PROJECT_ID="${PROJECT_ID:-boxwood-magnet-498623-n4}"
APP_ID="${AMPLIFY_APP_ID:-d9588bqvrp5xs}"
LOCAL_APP_URL="${LOCAL_APP_URL:-http://localhost:3000}"
AMPLIFY_APP_URL="${AMPLIFY_APP_URL:-https://dev.d9588bqvrp5xs.amplifyapp.com}"
LIST_TITLE="${GOOGLE_TASKS_LIST_TITLE:-Nesting Place Tasks}"
LOCAL_REDIRECT="${LOCAL_APP_URL%/}/api/tasks/google/callback"
AMPLIFY_REDIRECT="${AMPLIFY_APP_URL%/}/api/tasks/google/callback"
ENV_FILE="${ENV_FILE:-${ROOT}/.env.local}"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

upsert_env() {
  local key="$1"
  local value="$2"
  local file="$3"
  touch "$file"
  if grep -q "^${key}=" "$file" 2>/dev/null; then
    if [[ "$(uname)" == "Darwin" ]]; then
      sed -i '' "s|^${key}=.*|${key}=${value}|" "$file"
    else
      sed -i "s|^${key}=.*|${key}=${value}|" "$file"
    fi
  else
    printf '\n%s=%s\n' "$key" "$value" >>"$file"
  fi
}

remove_env_keys() {
  local file="$1"
  shift
  for key in "$@"; do
    if [[ "$(uname)" == "Darwin" ]]; then
      sed -i '' "/^${key}=/d" "$file"
    else
      sed -i "/^${key}=/d" "$file"
    fi
  done
}

read_env_value() {
  local key="$1"
  local file="$2"
  if [[ -f "$file" ]] && grep -q "^${key}=" "$file"; then
    grep "^${key}=" "$file" | tail -1 | cut -d= -f2-
  fi
}

require_cmd gcloud
require_cmd aws
require_cmd jq

ACTIVE_ACCOUNT="$(gcloud auth list --filter=status:ACTIVE --format='value(account)' 2>/dev/null | head -1 || true)"
if [[ -z "$ACTIVE_ACCOUNT" ]]; then
  echo "Run: gcloud auth login" >&2
  exit 1
fi

echo "=== Personal Google Tasks sync setup ==="
echo "GCP project:  ${PROJECT_ID}"
echo "GCP account:  ${ACTIVE_ACCOUNT}"
echo "Amplify app:  ${APP_ID}"
echo "Local redirect:   ${LOCAL_REDIRECT}"
echo "Amplify redirect: ${AMPLIFY_REDIRECT}"
echo ""

gcloud config set project "${PROJECT_ID}" >/dev/null

echo "Enabling Google Tasks API..."
gcloud services enable tasks.googleapis.com --project="${PROJECT_ID}" >/dev/null

CLIENT_ID="${GOOGLE_TASKS_OAUTH_CLIENT_ID:-$(read_env_value GOOGLE_TASKS_OAUTH_CLIENT_ID "$ENV_FILE")}"
CLIENT_SECRET="${GOOGLE_TASKS_OAUTH_CLIENT_SECRET:-$(read_env_value GOOGLE_TASKS_OAUTH_CLIENT_SECRET "$ENV_FILE")}"

if [[ -z "$CLIENT_ID" ]]; then
  echo "OAuth Web client ID not found."
  echo ""
  echo "Google does not expose OAuth client creation via gcloud. Create once in Console:"
  echo "  https://console.cloud.google.com/auth/clients/create?project=${PROJECT_ID}"
  echo ""
  echo "Application type: Web application"
  echo "Authorized redirect URIs:"
  echo "  ${LOCAL_REDIRECT}"
  echo "  ${AMPLIFY_REDIRECT}"
  echo ""
  if [[ "${NONINTERACTIVE:-false}" == "true" ]]; then
    echo "NONINTERACTIVE=true and credentials missing — aborting." >&2
    exit 1
  fi
  read -r -p "Paste GOOGLE_TASKS_OAUTH_CLIENT_ID: " CLIENT_ID
fi

if [[ -z "$CLIENT_SECRET" ]]; then
  if [[ "${NONINTERACTIVE:-false}" == "true" ]]; then
    echo "NONINTERACTIVE=true and GOOGLE_TASKS_OAUTH_CLIENT_SECRET missing — aborting." >&2
    exit 1
  fi
  read -r -s -p "Paste GOOGLE_TASKS_OAUTH_CLIENT_SECRET: " CLIENT_SECRET
  echo ""
fi

if [[ -z "$CLIENT_ID" || -z "$CLIENT_SECRET" ]]; then
  echo "OAuth client ID and secret are required." >&2
  exit 1
fi

echo ""
echo "Updating ${ENV_FILE}..."
upsert_env "GOOGLE_TASKS_ENABLED" "true" "$ENV_FILE"
upsert_env "GOOGLE_TASKS_SYNC_MODE" "personal" "$ENV_FILE"
upsert_env "GOOGLE_TASKS_OAUTH_CLIENT_ID" "$CLIENT_ID" "$ENV_FILE"
upsert_env "GOOGLE_TASKS_OAUTH_CLIENT_SECRET" "$CLIENT_SECRET" "$ENV_FILE"
upsert_env "GOOGLE_TASKS_LIST_TITLE" "$LIST_TITLE" "$ENV_FILE"
remove_env_keys "$ENV_FILE" \
  GOOGLE_TASKS_AUTH_MODE \
  GOOGLE_TASKS_DELEGATED_USER \
  GOOGLE_TASKS_IMPERSONATE_SERVICE_ACCOUNT \
  GOOGLE_TASKS_LIST_ID \
  GOOGLE_TASKS_ADC_JSON \
  GOOGLE_TASKS_OAUTH_REFRESH_TOKEN

echo "Pushing Amplify env vars..."
export GOOGLE_TASKS_OAUTH_CLIENT_ID="$CLIENT_ID"
export GOOGLE_TASKS_OAUTH_CLIENT_SECRET="$CLIENT_SECRET"
export GOOGLE_TASKS_OAUTH_REDIRECT_URI="$AMPLIFY_REDIRECT"
export AMPLIFY_APP_ID="$APP_ID"
export AMPLIFY_APP_URL="$AMPLIFY_APP_URL"
export GOOGLE_TASKS_LIST_TITLE="$LIST_TITLE"
"${ROOT}/infrastructure/aws/scripts/set-amplify-personal-google-tasks-env.sh"

if [[ "${REDEPLOY_AMPLIFY:-true}" == "true" ]]; then
  echo "Starting Amplify dev redeploy..."
  JOB_ID="$(aws amplify start-job \
    --app-id "$APP_ID" \
    --branch-name dev \
    --job-type RELEASE \
    --query 'jobSummary.jobId' \
    --output text)"
  echo "Amplify job #${JOB_ID} started on branch dev."
fi

cat <<EOF

=== Setup complete ===

Team sharing: /admin/tasks (same board for all management users)
Google mirror: each teammate connects their own Google account (matched by login email)

Next steps for each team member:
  1. Open ${AMPLIFY_APP_URL}/admin/tasks (or ${LOCAL_APP_URL}/admin/tasks locally)
  2. Click "Connect Google Tasks"
  3. Sign in with their @nesting-place.com Google account
  4. Tasks sync to their personal "Nesting Place Tasks" list

Local dev: restart npm run dev after .env.local changes.

EOF
