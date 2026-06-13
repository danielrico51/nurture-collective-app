#!/usr/bin/env bash
# Push concierge scheduling env vars to Amplify (delegated mode + ADC JSON).
#
# Safeguards (refuses to push broken credentials):
#   - Blocks info@nesting-place.com as delegated user
#   - Validates ADC JSON structure
#   - Runs live Calendar delegation test before upload (unless SKIP_CALENDAR_LIVE_TEST=1)
#
# Prerequisites:
#   gcloud auth application-default login
#   npm run verify:calendar-deploy   # same gate, can run standalone
#
# Usage:
#   ./infrastructure/aws/scripts/set-amplify-google-calendar-env.sh
#
# Optional overrides:
#   GOOGLE_CALENDAR_ADC_JSON_FILE=~/.config/gcloud/application_default_credentials.json
#   GOOGLE_CALENDAR_DELEGATED_USER=admin@nesting-place.com
#   SKIP_CALENDAR_LIVE_TEST=1        # emergency only — skips live token test
#   AMPLIFY_APP_ID=d9588bqvrp5xs
#   AMPLIFY_BRANCH=main              # also sync branch overrides (required for prod)
#   REDEPLOY=true                    # start Amplify RELEASE after update

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
APP_ID="${AMPLIFY_APP_ID:-d9588bqvrp5xs}"
BRANCH="${AMPLIFY_BRANCH:-}"
REDEPLOY="${REDEPLOY:-false}"
ADC_FILE="${GOOGLE_CALENDAR_ADC_JSON_FILE:-${GOOGLE_TASKS_ADC_JSON_FILE:-}}"
if [[ -z "$ADC_FILE" ]]; then
  GCLOUD_ACCOUNT="$(gcloud config get-value account 2>/dev/null || true)"
  LEGACY_ADC="${HOME}/.config/gcloud/legacy_credentials/${GCLOUD_ACCOUNT}/adc.json"
  DEFAULT_ADC="${HOME}/.config/gcloud/application_default_credentials.json"
  if [[ -n "$GCLOUD_ACCOUNT" && -f "$LEGACY_ADC" ]]; then
    ADC_FILE="$LEGACY_ADC"
  else
    ADC_FILE="$DEFAULT_ADC"
  fi
fi
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

DELEGATED_LOWER="$(printf '%s' "$DELEGATED_USER" | tr '[:upper:]' '[:lower:]')"
if [[ "$DELEGATED_LOWER" == "info@nesting-place.com" ]]; then
  echo "Refusing to push: GOOGLE_CALENDAR_DELEGATED_USER must be admin@nesting-place.com (intro calendar owner), not info@." >&2
  exit 1
fi

echo "Running Calendar deploy credential checks before pushing to Amplify..."
echo "  ADC file: $ADC_FILE"
(
  cd "$ROOT"
  GOOGLE_CALENDAR_ADC_JSON_FILE="$ADC_FILE" \
  GOOGLE_CALENDAR_DELEGATED_USER="$DELEGATED_USER" \
  GOOGLE_TASKS_IMPERSONATE_SERVICE_ACCOUNT="$IMPERSONATE_SA" \
  npm run verify:calendar-deploy
)

ADC_JSON="$(jq -c . "$ADC_FILE")"

TMP="${TMPDIR:-/tmp}/amplify-google-calendar-$$.json"
aws amplify get-app --app-id "$APP_ID" --query 'app.environmentVariables' --output json >"${TMP}.before"

jq \
  --arg enabled "true" \
  --arg authMode "delegated" \
  --arg delegatedUser "$DELEGATED_USER" \
  --arg tasksDelegatedUser "$DELEGATED_USER" \
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
    "GOOGLE_TASKS_DELEGATED_USER": $tasksDelegatedUser,
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

if [[ -n "$BRANCH" ]]; then
  echo "Syncing verified Calendar credentials to Amplify branch ${BRANCH}..."
  BRANCH_BEFORE="${TMP}.branch.before"
  aws amplify get-branch --app-id "$APP_ID" --branch-name "$BRANCH" \
    --query 'branch.environmentVariables' --output json >"$BRANCH_BEFORE"

  jq \
    --arg enabled "true" \
    --arg authMode "delegated" \
    --arg delegatedUser "$DELEGATED_USER" \
    --arg tasksDelegatedUser "$DELEGATED_USER" \
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
      "GOOGLE_TASKS_DELEGATED_USER": $tasksDelegatedUser,
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
    ' "$BRANCH_BEFORE" >"${TMP}.branch"

  aws amplify update-branch \
    --app-id "$APP_ID" \
    --branch-name "$BRANCH" \
    --environment-variables "file://${TMP}.branch" >/dev/null
  rm -f "$BRANCH_BEFORE" "${TMP}.branch"
fi

rm -f "${TMP}.before" "$TMP"

TARGET="app ${APP_ID}"
if [[ -n "$BRANCH" ]]; then
  TARGET="app ${APP_ID}, branch ${BRANCH}"
fi

echo ""
echo "Concierge scheduling env updated on Amplify ${TARGET}."
echo "  GOOGLE_CALENDAR_ENABLED=true"
echo "  GOOGLE_CALENDAR_AUTH_MODE=delegated"
echo "  GOOGLE_CALENDAR_DELEGATED_USER=${DELEGATED_USER}"
echo "  GOOGLE_TASKS_DELEGATED_USER=${DELEGATED_USER}"
echo "  GOOGLE_CALENDAR_ID=${CALENDAR_ID}"
echo "  GOOGLE_TASKS_IMPERSONATE_SERVICE_ACCOUNT=${IMPERSONATE_SA}"
echo "  GOOGLE_TASKS_ADC_JSON + GOOGLE_CALENDAR_ADC_JSON (verified before upload)"
echo ""

if [[ "$REDEPLOY" == "true" && -n "$BRANCH" ]]; then
  echo "Starting Amplify RELEASE on branch ${BRANCH}..."
  aws amplify start-job --app-id "$APP_ID" --branch-name "$BRANCH" --job-type RELEASE >/dev/null
  echo "Redeploy started for ${BRANCH}."
elif [[ -n "$BRANCH" ]]; then
  echo "Redeploy branch ${BRANCH} so the site picks up live scheduling:"
  echo "  aws amplify start-job --app-id ${APP_ID} --branch-name ${BRANCH} --job-type RELEASE"
else
  echo "Redeploy the dev branch so the site picks up live scheduling:"
  echo "  aws amplify start-job --app-id ${APP_ID} --branch-name dev --job-type RELEASE"
fi
