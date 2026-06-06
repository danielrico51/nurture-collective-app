#!/usr/bin/env bash
# Google Tasks sync — GCP setup for boxwood-magnet-498623-n4
#
# Auth options (org blocks JSON keys on this project):
#   A) ADC + tasks scope only (recommended local):
#        gcloud auth application-default login --scopes=https://www.googleapis.com/auth/tasks
#      GOOGLE_TASKS_AUTH_MODE=adc
#
#   B) Service account impersonation (no keys):
#        gcloud auth application-default login
#      GOOGLE_TASKS_AUTH_MODE=impersonate
#
#   C) Cloud Shell — pre-authenticated, run migrate script there
#
# Usage:
#   ./infrastructure/google/setup-tasks-sync.sh

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-boxwood-magnet-498623-n4}"
SA_NAME="${SA_NAME:-nurture-tasks-sync}"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
TASKS_SCOPE="https://www.googleapis.com/auth/tasks"
ACTIVE_ACCOUNT="$(gcloud auth list --filter=status:ACTIVE --format='value(account)' 2>/dev/null | head -1)"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "Install gcloud: brew install --cask google-cloud-sdk" >&2
  exit 1
fi

if [ -z "${ACTIVE_ACCOUNT}" ]; then
  echo "Run: gcloud auth login" >&2
  exit 1
fi

echo "Project:  ${PROJECT_ID}"
echo "Account:  ${ACTIVE_ACCOUNT}"
gcloud config set project "${PROJECT_ID}" >/dev/null

echo "Enabling APIs..."
gcloud services enable tasks.googleapis.com iamcredentials.googleapis.com --project="${PROJECT_ID}"

if ! gcloud iam service-accounts describe "${SA_EMAIL}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
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
echo "=== Setup complete ==="
echo "Service account: ${SA_EMAIL}"
echo "Client ID:       ${CLIENT_ID}"
echo ""
echo "=== Option A — local ADC (tasks scope only) ==="
echo "gcloud auth application-default login --scopes=${TASKS_SCOPE}"
echo ""
echo ".env.local:"
echo "GOOGLE_TASKS_ENABLED=true"
echo "GOOGLE_TASKS_AUTH_MODE=adc"
echo "GOOGLE_TASKS_LIST_TITLE=Nesting Place Tasks"
echo ""
echo "=== Option B — impersonate service account (no JSON key) ==="
echo "gcloud auth application-default login"
echo "GOOGLE_TASKS_AUTH_MODE=impersonate"
echo "GOOGLE_TASKS_IMPERSONATE_SERVICE_ACCOUNT=${SA_EMAIL}"
echo ""
echo "=== Option C — Cloud Shell ==="
echo "Open: https://console.cloud.google.com/cloudshell?project=${PROJECT_ID}"
echo "Clone repo, set GOOGLE_TASKS_AUTH_MODE=adc, run: npm run migrate:tasks-to-google"
echo ""
echo "=== Then ==="
echo "npm run migrate:tasks-to-google"
