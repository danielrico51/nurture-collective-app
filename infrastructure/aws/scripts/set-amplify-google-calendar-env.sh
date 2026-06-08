#!/usr/bin/env bash
# Push concierge scheduling env vars to Amplify (delegated mode + ADC JSON).
#
# Same pattern as set-amplify-google-tasks-env.sh — reuses nurture-tasks-sync SA.
#
# Prerequisites:
#   gcloud auth application-default login
#   Workspace domain-wide delegation (Calendar scope)
#
# Usage:
#   ./infrastructure/aws/scripts/set-amplify-google-calendar-env.sh
#
# Optional overrides:
#   GOOGLE_CALENDAR_ADC_JSON_FILE=~/.config/gcloud/application_default_credentials.json
#   GOOGLE_CALENDAR_DELEGATED_USER=info@nesting-place.com
#   GOOGLE_CALENDAR_ID=c_2d5a066a...@group.calendar.google.com
#   GOOGLE_TASKS_IMPERSONATE_SERVICE_ACCOUNT=nurture-tasks-sync@...
#   AMPLIFY_APP_ID=d9588bqvrp5xs

set -euo pipefail

APP_ID="${AMPLIFY_APP_ID:-d9588bqvrp5xs}"
ADC_FILE="${GOOGLE_CALENDAR_ADC_JSON_FILE:-${GOOGLE_TASKS_ADC_JSON_FILE:-${HOME}/.config/gcloud/application_default_credentials.json}}"
DELEGATED_USER="${GOOGLE_CALENDAR_DELEGATED_USER:-admin@nesting-place.com}"
IMPERSONATE_SA="${GOOGLE_TASKS_IMPERSONATE_SERVICE_ACCOUNT:-nurture-tasks-sync@boxwood-magnet-498623-n4.iam.gserviceaccount.com}"
CALENDAR_ID="${GOOGLE_CALENDAR_ID:-c_2d5a066a46512e1ec02b55c8c92e83e00a9a8e77655de2e712a347fbb969552c@group.calendar.google.com}"
BOOKING_TIMEZONE="${GOOGLE_BOOKING_TIMEZONE:-America/New_York}"
BOOKING_DURATION="${GOOGLE_BOOKING_DURATION_MINUTES:-30}"
BOOKING_BUFFER="${GOOGLE_BOOKING_BUFFER_MINUTES:-15}"
BOOKING_WORK_START="${GOOGLE_BOOKING_WORK_HOURS_START:-09:00}"
BOOKING_WORK_END="${GOOGLE_BOOKING_WORK_HOURS_END:-17:00}"
BOOKING_WORK_DAYS="${GOOGLE_BOOKING_WORK_DAYS:-1,2,3,4,5}"
BOOKING_HORIZON="${GOOGLE_BOOKING_HORIZON_DAYS:-14}"
BOOKING_MIN_LEAD="${GOOGLE_BOOKING_MIN_LEAD_HOURS:-2}"

if [[ ! -f "$ADC_FILE" ]]; then
  echo "ADC file not found: $ADC_FILE" >&2
  echo "Run: gcloud auth application-default login" >&2
  exit 1
fi

if ! command -v aws >/dev/null 2>&1 || ! command -v jq >/dev/null 2>&1; then
  echo "aws CLI and jq are required." >&2
  exit 1
fi

ADC_JSON="$(jq -c . "$ADC_FILE")"

TMP="${TMPDIR:-/tmp}/amplify-google-calendar-$$.json"
aws amplify get-app --app-id "$APP_ID" --query 'app.environmentVariables' --output json >"${TMP}.before"

jq \
  --arg enabled "true" \
  --arg authMode "delegated" \
  --arg delegatedUser "$DELEGATED_USER" \
  --arg impersonateSa "$IMPERSONATE_SA" \
  --arg calendarId "$CALENDAR_ID" \
  --arg adcJson "$ADC_JSON" \
  --arg timezone "$BOOKING_TIMEZONE" \
  --arg duration "$BOOKING_DURATION" \
  --arg buffer "$BOOKING_BUFFER" \
  --arg workStart "$BOOKING_WORK_START" \
  --arg workEnd "$BOOKING_WORK_END" \
  --arg workDays "$BOOKING_WORK_DAYS" \
  --arg horizon "$BOOKING_HORIZON" \
  --arg minLead "$BOOKING_MIN_LEAD" \
  '
  . + {
    "GOOGLE_CALENDAR_ENABLED": $enabled,
    "GOOGLE_CALENDAR_AUTH_MODE": $authMode,
    "GOOGLE_CALENDAR_DELEGATED_USER": $delegatedUser,
    "GOOGLE_CALENDAR_ID": $calendarId,
    "GOOGLE_CALENDAR_ADC_JSON": $adcJson,
    "GOOGLE_TASKS_IMPERSONATE_SERVICE_ACCOUNT": $impersonateSa,
    "GOOGLE_TASKS_ADC_JSON": $adcJson,
    "GOOGLE_BOOKING_TIMEZONE": $timezone,
    "GOOGLE_BOOKING_DURATION_MINUTES": $duration,
    "GOOGLE_BOOKING_BUFFER_MINUTES": $buffer,
    "GOOGLE_BOOKING_WORK_HOURS_START": $workStart,
    "GOOGLE_BOOKING_WORK_HOURS_END": $workEnd,
    "GOOGLE_BOOKING_WORK_DAYS": $workDays,
    "GOOGLE_BOOKING_HORIZON_DAYS": $horizon,
    "GOOGLE_BOOKING_MIN_LEAD_HOURS": $minLead
  }
  ' "${TMP}.before" >"$TMP"

aws amplify update-app --app-id "$APP_ID" --environment-variables "file://${TMP}" >/dev/null
rm -f "${TMP}.before" "$TMP"

echo "Concierge scheduling env updated on Amplify app ${APP_ID}."
echo "  GOOGLE_CALENDAR_ENABLED=true"
echo "  GOOGLE_CALENDAR_AUTH_MODE=delegated"
echo "  GOOGLE_CALENDAR_DELEGATED_USER=${DELEGATED_USER}"
echo "  GOOGLE_CALENDAR_ID=${CALENDAR_ID}"
echo "  GOOGLE_TASKS_IMPERSONATE_SERVICE_ACCOUNT=${IMPERSONATE_SA}"
echo "  GOOGLE_TASKS_ADC_JSON + GOOGLE_CALENDAR_ADC_JSON (from ADC)"
echo ""
echo "Redeploy the dev branch so the site picks up live scheduling:"
echo "  aws amplify start-job --app-id ${APP_ID} --branch-name dev --job-type RELEASE"
