#!/usr/bin/env bash
# Push personal Google Tasks sync env vars to Amplify (per-team-member OAuth).
#
# Usage:
#   export GOOGLE_TASKS_OAUTH_CLIENT_ID='....apps.googleusercontent.com'
#   export GOOGLE_TASKS_OAUTH_CLIENT_SECRET='....'
#   ./infrastructure/aws/scripts/set-amplify-personal-google-tasks-env.sh
#
# Optional:
#   AMPLIFY_APP_ID=d9588bqvrp5xs
#   AMPLIFY_APP_URL=https://dev.d9588bqvrp5xs.amplifyapp.com
#   GOOGLE_TASKS_LIST_TITLE=Nesting Place Tasks

set -euo pipefail

APP_ID="${AMPLIFY_APP_ID:-d9588bqvrp5xs}"
APP_URL="${AMPLIFY_APP_URL:-https://dev.d9588bqvrp5xs.amplifyapp.com}"
LIST_TITLE="${GOOGLE_TASKS_LIST_TITLE:-Nesting Place Tasks}"
REDIRECT_URI="${GOOGLE_TASKS_OAUTH_REDIRECT_URI:-${APP_URL%/}/api/tasks/google/callback}"

if [[ -z "${GOOGLE_TASKS_OAUTH_CLIENT_ID:-}" || -z "${GOOGLE_TASKS_OAUTH_CLIENT_SECRET:-}" ]]; then
  echo "Set GOOGLE_TASKS_OAUTH_CLIENT_ID and GOOGLE_TASKS_OAUTH_CLIENT_SECRET first." >&2
  exit 1
fi

TMP="${TMPDIR:-/tmp}/amplify-google-tasks-personal-$$.json"
aws amplify get-app --app-id "$APP_ID" --query 'app.environmentVariables' --output json >"${TMP}.before"

jq \
  --arg enabled "true" \
  --arg syncMode "personal" \
  --arg clientId "$GOOGLE_TASKS_OAUTH_CLIENT_ID" \
  --arg clientSecret "$GOOGLE_TASKS_OAUTH_CLIENT_SECRET" \
  --arg redirectUri "$REDIRECT_URI" \
  --arg listTitle "$LIST_TITLE" \
  '
  . + {
    "GOOGLE_TASKS_ENABLED": $enabled,
    "GOOGLE_TASKS_SYNC_MODE": $syncMode,
    "GOOGLE_TASKS_OAUTH_CLIENT_ID": $clientId,
    "GOOGLE_TASKS_OAUTH_CLIENT_SECRET": $clientSecret,
    "GOOGLE_TASKS_OAUTH_REDIRECT_URI": $redirectUri,
    "GOOGLE_TASKS_LIST_TITLE": $listTitle
  }
  | del(
      .GOOGLE_TASKS_AUTH_MODE,
      .GOOGLE_TASKS_DELEGATED_USER,
      .GOOGLE_TASKS_IMPERSONATE_SERVICE_ACCOUNT,
      .GOOGLE_TASKS_LIST_ID,
      .GOOGLE_TASKS_ADC_JSON,
      .GOOGLE_TASKS_OAUTH_REFRESH_TOKEN
    )
  ' "${TMP}.before" >"$TMP"

aws amplify update-app --app-id "$APP_ID" --environment-variables "file://${TMP}" >/dev/null
rm -f "${TMP}.before" "$TMP"

echo "Personal Google Tasks env updated on Amplify app ${APP_ID}."
echo "  GOOGLE_TASKS_SYNC_MODE=personal"
echo "  GOOGLE_TASKS_OAUTH_REDIRECT_URI=${REDIRECT_URI}"
echo ""
echo "Redeploy dev so the site picks up personal sync."
