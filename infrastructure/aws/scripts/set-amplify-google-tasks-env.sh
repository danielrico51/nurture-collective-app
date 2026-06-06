#!/usr/bin/env bash
# Push Google Tasks sync env vars to Amplify (delegated mode + ADC JSON).
#
# Prerequisites:
#   gcloud auth application-default login   # on the machine running this script
#   Workspace domain-wide delegation for nurture-tasks-sync client ID
#
# Usage:
#   ./infrastructure/aws/scripts/set-amplify-google-tasks-env.sh
#
# Optional overrides:
#   GOOGLE_TASKS_ADC_JSON_FILE=~/.config/gcloud/application_default_credentials.json
#   GOOGLE_TASKS_DELEGATED_USER=admin@nesting-place.com
#   GOOGLE_TASKS_LIST_ID=bXFfOFBXaDFUbVRVTW5kUQ
#   AMPLIFY_APP_ID=d9588bqvrp5xs

set -euo pipefail

APP_ID="${AMPLIFY_APP_ID:-d9588bqvrp5xs}"
ADC_FILE="${GOOGLE_TASKS_ADC_JSON_FILE:-${HOME}/.config/gcloud/application_default_credentials.json}"
DELEGATED_USER="${GOOGLE_TASKS_DELEGATED_USER:-admin@nesting-place.com}"
IMPERSONATE_SA="${GOOGLE_TASKS_IMPERSONATE_SERVICE_ACCOUNT:-nurture-tasks-sync@boxwood-magnet-498623-n4.iam.gserviceaccount.com}"
LIST_ID="${GOOGLE_TASKS_LIST_ID:-bXFfOFBXaDFUbVRVTW5kUQ}"
LIST_TITLE="${GOOGLE_TASKS_LIST_TITLE:-Nesting Place Tasks}"

if [[ ! -f "$ADC_FILE" ]]; then
  echo "ADC file not found: $ADC_FILE" >&2
  echo "Run: gcloud auth application-default login" >&2
  exit 1
fi

ADC_JSON="$(jq -c . "$ADC_FILE")"

TMP="${TMPDIR:-/tmp}/amplify-google-tasks-$$.json"
aws amplify get-app --app-id "$APP_ID" --query 'app.environmentVariables' --output json >"${TMP}.before"

jq \
  --arg enabled "true" \
  --arg authMode "delegated" \
  --arg delegatedUser "$DELEGATED_USER" \
  --arg impersonateSa "$IMPERSONATE_SA" \
  --arg listId "$LIST_ID" \
  --arg listTitle "$LIST_TITLE" \
  --arg adcJson "$ADC_JSON" \
  '
  . + {
    "GOOGLE_TASKS_ENABLED": $enabled,
    "GOOGLE_TASKS_AUTH_MODE": $authMode,
    "GOOGLE_TASKS_DELEGATED_USER": $delegatedUser,
    "GOOGLE_TASKS_IMPERSONATE_SERVICE_ACCOUNT": $impersonateSa,
    "GOOGLE_TASKS_LIST_ID": $listId,
    "GOOGLE_TASKS_LIST_TITLE": $listTitle,
    "GOOGLE_TASKS_ADC_JSON": $adcJson
  }
  ' "${TMP}.before" >"$TMP"

aws amplify update-app --app-id "$APP_ID" --environment-variables "file://${TMP}" >/dev/null
rm -f "${TMP}.before" "$TMP"

echo "Google Tasks env updated on Amplify app ${APP_ID}."
echo "  GOOGLE_TASKS_ENABLED=true"
echo "  GOOGLE_TASKS_AUTH_MODE=delegated"
echo "  GOOGLE_TASKS_DELEGATED_USER=${DELEGATED_USER}"
echo "  GOOGLE_TASKS_LIST_ID=${LIST_ID}"
echo ""
echo "Redeploy the dev branch so the site picks up sync."
echo "Note: ADC refresh tokens expire — re-run this script if sync stops on Amplify."
