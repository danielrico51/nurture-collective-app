#!/usr/bin/env bash
# Merge Events & Classes registration env into Amplify Hosting (branch-specific).
#
# Usage (production / main):
#   AMPLIFY_BRANCH=main ./infrastructure/aws/scripts/set-amplify-class-registration-env.sh
#
# Usage (dev — usually already set):
#   AMPLIFY_BRANCH=dev ./infrastructure/aws/scripts/set-amplify-class-registration-env.sh
#
# Optional overrides:
#   AMPLIFY_APP_ID=d9588bqvrp5xs
#   NEXT_PUBLIC_CLASS_REGISTRATION_VENMO_HANDLE=@thenestingplace
#   CLASS_REGISTRATION_ADMIN_EMAIL=info@nesting-place.com
#   CLASS_REGISTRATION_PROVIDER_ACCESS_SECRET=<long-random-secret>
#   CLASS_EVENTS_GOOGLE_CALENDAR_ID=c_6c4c40e2772622371ffcd13d9f51dd52474ad5f05740f10faf1d4468a272f415@group.calendar.google.com

set -euo pipefail

APP_ID="${AMPLIFY_APP_ID:-d9588bqvrp5xs}"
BRANCH="${AMPLIFY_BRANCH:-main}"
VENMO_HANDLE="${NEXT_PUBLIC_CLASS_REGISTRATION_VENMO_HANDLE:-@thenestingplace}"
ADMIN_EMAIL="${CLASS_REGISTRATION_ADMIN_EMAIL:-info@nesting-place.com}"
CALENDAR_ID="${CLASS_EVENTS_GOOGLE_CALENDAR_ID:-c_6c4c40e2772622371ffcd13d9f51dd52474ad5f05740f10faf1d4468a272f415@group.calendar.google.com}"

if [[ -z "${CLASS_REGISTRATION_PROVIDER_ACCESS_SECRET:-}" ]]; then
  CLASS_REGISTRATION_PROVIDER_ACCESS_SECRET="$(openssl rand -base64 32 | tr -d '\n')"
  echo "Generated CLASS_REGISTRATION_PROVIDER_ACCESS_SECRET for ${BRANCH}."
fi

TMP_DIR="${TMPDIR:-/tmp}"
BRANCH_BEFORE="${TMP_DIR}/amplify-branch-${BRANCH}-before-$$.json"
BRANCH_MERGED="${TMP_DIR}/amplify-branch-${BRANCH}-merged-$$.json"

aws amplify get-branch \
  --app-id "$APP_ID" \
  --branch-name "$BRANCH" \
  --query 'branch.environmentVariables' \
  --output json >"$BRANCH_BEFORE"

jq \
  --arg venmoPublic "$VENMO_HANDLE" \
  --arg venmoServer "$VENMO_HANDLE" \
  --arg adminEmail "$ADMIN_EMAIL" \
  --arg providerSecret "$CLASS_REGISTRATION_PROVIDER_ACCESS_SECRET" \
  --arg calendarId "$CALENDAR_ID" \
  '
  . + {
    "NEXT_PUBLIC_CLASS_REGISTRATION_PAYMENTS_ENABLED": "true",
    "NEXT_PUBLIC_CLASS_REGISTRATION_STRIPE_ENABLED": "true",
    "NEXT_PUBLIC_CLASS_REGISTRATION_VENMO_HANDLE": $venmoPublic,
    "CLASS_REGISTRATION_VENMO_HANDLE": $venmoServer,
    "CLASS_REGISTRATION_EMAIL_ENABLED": "true",
    "CLASS_REGISTRATION_ADMIN_EMAIL": $adminEmail,
    "CLASS_REGISTRATION_PROVIDER_ACCESS_SECRET": $providerSecret,
    "CLASS_EVENTS_GOOGLE_CALENDAR_ID": $calendarId,
    "CLASS_EVENTS_CALENDAR_SYNC_ENABLED": "true"
  }
  ' "$BRANCH_BEFORE" >"$BRANCH_MERGED"

aws amplify update-branch \
  --app-id "$APP_ID" \
  --branch-name "$BRANCH" \
  --environment-variables "file://${BRANCH_MERGED}" >/dev/null

rm -f "$BRANCH_BEFORE" "$BRANCH_MERGED"

echo "Class registration env updated on Amplify branch: ${BRANCH}"
echo "  NEXT_PUBLIC_CLASS_REGISTRATION_PAYMENTS_ENABLED=true"
echo "  NEXT_PUBLIC_CLASS_REGISTRATION_STRIPE_ENABLED=true"
echo "  NEXT_PUBLIC_CLASS_REGISTRATION_VENMO_HANDLE=${VENMO_HANDLE}"
echo "  CLASS_REGISTRATION_VENMO_HANDLE=${VENMO_HANDLE}"
echo "  CLASS_REGISTRATION_EMAIL_ENABLED=true"
echo "  CLASS_REGISTRATION_ADMIN_EMAIL=${ADMIN_EMAIL}"
echo "  CLASS_EVENTS_GOOGLE_CALENDAR_ID=${CALENDAR_ID}"
echo "  CLASS_EVENTS_CALENDAR_SYNC_ENABLED=true"
echo "  CLASS_REGISTRATION_PROVIDER_ACCESS_SECRET=set"
echo ""
if [[ "$BRANCH" == "main" ]]; then
  echo "Production checklist:"
  echo "  1. Merge dev → main in GitHub, then redeploy main (or redeploy now if code is already merged)."
  echo "  2. Stripe webhook: https://www.nesting-place.com/api/webhooks/stripe"
  echo "     Event: checkout.session.completed (class_registration + gift_card orders)."
  echo "  3. Google Calendar: share classes calendar with admin@nesting-place.com (Make changes to events)."
  echo "  4. Admin → Events & classes → Settings: confirm Email / Payments / Calendar show On."
  echo "  5. Publish classes on production admin — dev listings stay in management/events/dev/."
else
  echo "Redeploy the ${BRANCH} branch in Amplify Console."
fi
