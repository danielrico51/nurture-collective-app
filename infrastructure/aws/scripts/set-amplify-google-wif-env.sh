#!/usr/bin/env bash
# Push Workload Identity Federation env vars to Amplify (no secrets — pool/provider IDs only).
#
# Usage:
#   ./infrastructure/aws/scripts/set-amplify-google-wif-env.sh
#
# Required (or from setup-workload-identity-federation.sh):
#   GOOGLE_WORKLOAD_IDENTITY_PROJECT_NUMBER
#   GOOGLE_WORKLOAD_IDENTITY_POOL_ID
#   GOOGLE_WORKLOAD_IDENTITY_PROVIDER_ID
#   GOOGLE_WORKLOAD_IDENTITY_SERVICE_ACCOUNT
#
# Optional:
#   AMPLIFY_APP_ID=d9588bqvrp5xs
#   AMPLIFY_BRANCH=main
#   REDEPLOY=true
#   REMOVE_ADC_JSON=true   # unset GOOGLE_CALENDAR_ADC_JSON / GOOGLE_TASKS_ADC_JSON after WIF

set -euo pipefail

APP_ID="${AMPLIFY_APP_ID:-d9588bqvrp5xs}"
BRANCH="${AMPLIFY_BRANCH:-main}"
REDEPLOY="${REDEPLOY:-false}"
REMOVE_ADC_JSON="${REMOVE_ADC_JSON:-false}"

PROJECT_NUMBER="${GOOGLE_WORKLOAD_IDENTITY_PROJECT_NUMBER:-}"
POOL_ID="${GOOGLE_WORKLOAD_IDENTITY_POOL_ID:-}"
PROVIDER_ID="${GOOGLE_WORKLOAD_IDENTITY_PROVIDER_ID:-}"
SA_EMAIL="${GOOGLE_WORKLOAD_IDENTITY_SERVICE_ACCOUNT:-}"

for var in PROJECT_NUMBER POOL_ID PROVIDER_ID SA_EMAIL; do
  if [[ -z "${!var}" ]]; then
    echo "Missing GOOGLE_WORKLOAD_IDENTITY_* env. Run setup-workload-identity-federation.sh first." >&2
    exit 1
  fi
done

TMP_DIR="${TMPDIR:-/tmp}"
SRC="$(mktemp "${TMP_DIR}/amplify-env.XXXXXX")"
DEST="$(mktemp "${TMP_DIR}/amplify-env-new.XXXXXX")"

aws amplify get-branch --app-id "$APP_ID" --branch-name "$BRANCH" \
  --query 'branch.environmentVariables' --output json >"$SRC"

jq \
  --arg projectNumber "$PROJECT_NUMBER" \
  --arg poolId "$POOL_ID" \
  --arg providerId "$PROVIDER_ID" \
  --arg saEmail "$SA_EMAIL" \
  '
  . + {
    "GOOGLE_WORKLOAD_IDENTITY_PROJECT_NUMBER": $projectNumber,
    "GOOGLE_WORKLOAD_IDENTITY_POOL_ID": $poolId,
    "GOOGLE_WORKLOAD_IDENTITY_PROVIDER_ID": $providerId,
    "GOOGLE_WORKLOAD_IDENTITY_SERVICE_ACCOUNT": $saEmail,
    "GOOGLE_CALENDAR_AUTH_MODE": "wif",
    "GOOGLE_TASKS_AUTH_MODE": "wif"
  }
  ' "$SRC" >"$DEST"

if [[ "$REMOVE_ADC_JSON" == "true" ]]; then
  jq 'del(.GOOGLE_CALENDAR_ADC_JSON, .GOOGLE_TASKS_ADC_JSON)' "$DEST" >"${DEST}.2"
  mv "${DEST}.2" "$DEST"
fi

aws amplify update-branch \
  --app-id "$APP_ID" \
  --branch-name "$BRANCH" \
  --environment-variables "file://${DEST}" \
  --output json >/dev/null

rm -f "$SRC" "$DEST"

echo "Amplify branch ${BRANCH}: WIF env updated."
echo "  GOOGLE_WORKLOAD_IDENTITY_PROJECT_NUMBER=${PROJECT_NUMBER}"
echo "  GOOGLE_WORKLOAD_IDENTITY_POOL_ID=${POOL_ID}"
echo "  GOOGLE_WORKLOAD_IDENTITY_PROVIDER_ID=${PROVIDER_ID}"
echo "  GOOGLE_WORKLOAD_IDENTITY_SERVICE_ACCOUNT=${SA_EMAIL}"
echo "  GOOGLE_CALENDAR_AUTH_MODE=wif"

if [[ "$REDEPLOY" == "true" ]]; then
  aws amplify start-job --app-id "$APP_ID" --branch-name "$BRANCH" --job-type RELEASE --output text >/dev/null
  echo "Redeploy started for ${BRANCH}."
fi
