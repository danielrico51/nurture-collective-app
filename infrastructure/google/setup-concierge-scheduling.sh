#!/usr/bin/env bash
# Concierge live scheduling — same CLI pattern as Google Tasks (no JSON keys).
#
# Uses domain-wide delegation: the app acts as admin@nesting-place.com via
# nurture-tasks-sync service account + gcloud ADC + IAM signJwt.
#
# Automates via CLI:
#   - Calendar API + IAM Credentials API enablement
#   - Reuses nurture-tasks-sync service account
#   - Service Account Token Creator for your gcloud user
#   - .env.local update (delegated auth mode)
#   - Workspace domain-wide delegation deep link (browser)
#   - Optional Amplify env + redeploy
#
# Prerequisites:
#   gcloud auth login
#   gcloud auth application-default login
#
# Usage:
#   ./infrastructure/google/setup-concierge-scheduling.sh
#
# Optional:
#   PROJECT_ID=boxwood-magnet-498623-n4
#   AMPLIFY_APP_ID=d9588bqvrp5xs
#   REDEPLOY_AMPLIFY=true
#   OPEN_DELEGATION_BROWSER=1

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PROJECT_ID="${PROJECT_ID:-boxwood-magnet-498623-n4}"
APP_ID="${AMPLIFY_APP_ID:-d9588bqvrp5xs}"
SA_NAME="${SA_NAME:-nurture-tasks-sync}"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
DELEGATED_USER="${GOOGLE_CALENDAR_DELEGATED_USER:-admin@nesting-place.com}"
CALENDAR_ID="${GOOGLE_CALENDAR_ID:-c_2d5a066a46512e1ec02b55c8c92e83e00a9a8e77655de2e712a347fbb969552c@group.calendar.google.com}"
ENV_FILE="${ENV_FILE:-${ROOT}/.env.local}"
OPEN_DELEGATION_BROWSER="${OPEN_DELEGATION_BROWSER:-1}"
REDEPLOY_AMPLIFY="${REDEPLOY_AMPLIFY:-true}"
PUSH_AMPLIFY="${PUSH_AMPLIFY:-true}"

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

require_cmd gcloud

ACTIVE_ACCOUNT="$(gcloud auth list --filter=status:ACTIVE --format='value(account)' 2>/dev/null | head -1 || true)"
if [[ -z "$ACTIVE_ACCOUNT" ]]; then
  echo "Run: gcloud auth login" >&2
  exit 1
fi

if ! gcloud auth application-default print-access-token >/dev/null 2>&1; then
  echo "Run: gcloud auth application-default login" >&2
  exit 1
fi

echo "=== Concierge live scheduling setup ==="
echo "GCP project:      ${PROJECT_ID}"
echo "GCP account:      ${ACTIVE_ACCOUNT}"
echo "Service account:  ${SA_EMAIL}"
echo "Delegated user:   ${DELEGATED_USER}"
echo "Calendar ID:      ${CALENDAR_ID}"
echo ""

gcloud config set project "${PROJECT_ID}" >/dev/null

echo "Enabling APIs..."
# Workspace Calendar API service ID is calendar-json (not calendar.googleapis.com).
# calendarmcp.googleapis.com is a different product — not used by this app.
CALENDAR_API="calendar-json.googleapis.com"
for API in "${CALENDAR_API}" iamcredentials.googleapis.com; do
  if gcloud services list --enabled --project="${PROJECT_ID}" \
    --filter="name:${API}" --format='value(name)' 2>/dev/null | grep -q "${API}"; then
    echo "  already enabled: ${API}"
    continue
  fi
  echo "  enabling: ${API}"
  if ! gcloud services enable "${API}" --project="${PROJECT_ID}" --quiet; then
    cat >&2 <<EOF

Failed to enable ${API}.

If you enabled "Calendar MCP API" in Console, that is not the same API.
Enable the Workspace Calendar API instead:
  https://console.cloud.google.com/apis/library/calendar-json.googleapis.com?project=${PROJECT_ID}

Or run:
  gcloud services enable calendar-json.googleapis.com --project=${PROJECT_ID}

EOF
    exit 1
  fi
done

if ! gcloud iam service-accounts describe "${SA_EMAIL}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  echo "Creating service account ${SA_NAME}..."
  gcloud iam service-accounts create "${SA_NAME}" \
    --project="${PROJECT_ID}" \
    --display-name="Nesting Place Tasks Sync"
fi

echo "Granting Service Account Token Creator to ${ACTIVE_ACCOUNT}..."
gcloud iam service-accounts add-iam-policy-binding "${SA_EMAIL}" \
  --project="${PROJECT_ID}" \
  --member="user:${ACTIVE_ACCOUNT}" \
  --role="roles/iam.serviceAccountTokenCreator" \
  --quiet >/dev/null

CLIENT_ID="$(gcloud iam service-accounts describe "${SA_EMAIL}" \
  --project="${PROJECT_ID}" \
  --format='value(oauth2ClientId)')"

echo ""
echo "Updating ${ENV_FILE}..."
upsert_env "GOOGLE_CALENDAR_ENABLED" "true" "$ENV_FILE"
upsert_env "GOOGLE_CALENDAR_AUTH_MODE" "delegated" "$ENV_FILE"
upsert_env "GOOGLE_CALENDAR_ID" "$CALENDAR_ID" "$ENV_FILE"
upsert_env "GOOGLE_CALENDAR_DELEGATED_USER" "$DELEGATED_USER" "$ENV_FILE"
upsert_env "GOOGLE_TASKS_IMPERSONATE_SERVICE_ACCOUNT" "$SA_EMAIL" "$ENV_FILE"

echo ""
echo "Opening Workspace domain-wide delegation (Calendar + Tasks scopes)..."
OPEN_BROWSER="${OPEN_DELEGATION_BROWSER}" \
  SERVICE_ACCOUNT_EMAIL="${SA_EMAIL}" \
  SERVICE_ACCOUNT_CLIENT_ID="${CLIENT_ID}" \
  DELEGATED_ADMIN="${DELEGATED_USER}" \
  "${ROOT}/infrastructure/google/configure-domain-wide-delegation.sh"

if [[ "${PUSH_AMPLIFY}" == "true" ]] && command -v aws >/dev/null 2>&1 && command -v jq >/dev/null 2>&1; then
  echo ""
  echo "Pushing scheduling env to Amplify app ${APP_ID}..."
  export AMPLIFY_APP_ID="$APP_ID"
  export GOOGLE_CALENDAR_ID="$CALENDAR_ID"
  export GOOGLE_CALENDAR_DELEGATED_USER="$DELEGATED_USER"
  export GOOGLE_TASKS_IMPERSONATE_SERVICE_ACCOUNT="$SA_EMAIL"
  "${ROOT}/infrastructure/aws/scripts/set-amplify-google-calendar-env.sh"

  if [[ "${REDEPLOY_AMPLIFY}" == "true" ]]; then
    JOB_ID="$(aws amplify start-job \
      --app-id "$APP_ID" \
      --branch-name dev \
      --job-type RELEASE \
      --query 'jobSummary.jobId' \
      --output text)"
    echo "Amplify job #${JOB_ID} started on branch dev."
  fi
elif [[ "${PUSH_AMPLIFY}" == "true" ]]; then
  echo "aws/jq not found — run infrastructure/aws/scripts/set-amplify-google-calendar-env.sh manually."
fi

cat <<EOF

=== Setup complete ===

Auth mode: delegated (same as Google Tasks — no service account JSON keys)
Runtime:   ${SA_EMAIL} impersonates ${DELEGATED_USER} for Calendar API

No calendar ACL share is required — the app acts as ${DELEGATED_USER}, who should
already own or manage the intro-call calendar.

Next steps:
  1. Finish domain-wide delegation in Workspace Admin (browser step above).
  2. Restart local dev:
       npm run dev
  3. Verify credentials BEFORE pushing to Amplify:
       npm run verify:calendar-deploy
     Expect: OK [delegation]: Calendar access token received...
     Uses ~/.config/gcloud/legacy_credentials/<account>/adc.json when present (often fresher than application-default).
     Re-run periodically — authorized_user tokens expire in prod and the deploy gate does not monitor runtime.
  4. Push to Amplify when verify passes:
       AMPLIFY_BRANCH=main REDEPLOY=true npm run amplify:concierge-scheduling
  5. Verify runtime:
       curl -s http://localhost:3000/api/scheduling/status
     Expect: "enabled":true,"configured":true
  5. Fresh concierge chat with name + email → "Pick an open introductory call time"

EOF
