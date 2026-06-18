#!/usr/bin/env bash
# Client CRM email (invoices, communications) + invoice PDF link secrets on Amplify.
#
# Client emails use CLIENT_COMMS_EMAIL_FROM when set, otherwise GIFT_CARD_EMAIL_FROM.
# Run the gift-card email script first if neither sender is configured:
#   ./infrastructure/aws/scripts/set-amplify-gift-card-email-env.sh
#
# Usage (dev):
#   AMPLIFY_BRANCH=dev ./infrastructure/aws/scripts/set-amplify-client-comms-env.sh
#
# Usage (production):
#   AMPLIFY_BRANCH=main ./infrastructure/aws/scripts/set-amplify-client-comms-env.sh
#
# Optional overrides:
#   CLIENT_COMMS_EMAIL_FROM=info@nesting-place.com
#   CLIENT_COMMS_EMAIL_FROM_NAME='The Nesting Place'
#   CLIENT_COMMS_EMAIL_REPLY_TO=info@nesting-place.com
#   CLIENT_INVOICE_VENMO_HANDLE=@thenestingplace
#   CLIENT_INVOICE_ZELLE_EMAIL=thenestingplacenj@gmail.com
#   CLIENT_INVOICE_ACCESS_SECRET=<long-random-secret>
#   AMPLIFY_APP_ID=d9588bqvrp5xs

set -euo pipefail

APP_ID="${AMPLIFY_APP_ID:-d9588bqvrp5xs}"
BRANCH="${AMPLIFY_BRANCH:-dev}"

COMMS_FROM="${CLIENT_COMMS_EMAIL_FROM:-${GIFT_CARD_EMAIL_FROM:-info@nesting-place.com}}"
COMMS_FROM_NAME="${CLIENT_COMMS_EMAIL_FROM_NAME:-${GIFT_CARD_EMAIL_FROM_NAME:-The Nesting Place}}"
COMMS_REPLY_TO="${CLIENT_COMMS_EMAIL_REPLY_TO:-${GIFT_CARD_EMAIL_REPLY_TO:-$COMMS_FROM}}"
VENMO_HANDLE="${CLIENT_INVOICE_VENMO_HANDLE:-@thenestingplace}"
ZELLE_EMAIL="${CLIENT_INVOICE_ZELLE_EMAIL:-thenestingplacenj@gmail.com}"

if [[ -z "${CLIENT_INVOICE_ACCESS_SECRET:-}" ]]; then
  CLIENT_INVOICE_ACCESS_SECRET="$(openssl rand -base64 32 | tr -d '\n')"
  echo "Generated CLIENT_INVOICE_ACCESS_SECRET for ${BRANCH}."
fi

TMP_DIR="${TMPDIR:-/tmp}"
BRANCH_BEFORE="${TMP_DIR}/amplify-client-comms-${BRANCH}-before-$$.json"
BRANCH_MERGED="${TMP_DIR}/amplify-client-comms-${BRANCH}-merged-$$.json"

aws amplify get-branch \
  --app-id "$APP_ID" \
  --branch-name "$BRANCH" \
  --query 'branch.environmentVariables' \
  --output json >"$BRANCH_BEFORE"

jq \
  --arg commsFrom "$COMMS_FROM" \
  --arg commsFromName "$COMMS_FROM_NAME" \
  --arg commsReplyTo "$COMMS_REPLY_TO" \
  --arg venmo "$VENMO_HANDLE" \
  --arg zelle "$ZELLE_EMAIL" \
  --arg accessSecret "$CLIENT_INVOICE_ACCESS_SECRET" \
  '
  . + {
    "CLIENT_COMMS_EMAIL_FROM": $commsFrom,
    "CLIENT_COMMS_EMAIL_FROM_NAME": $commsFromName,
    "CLIENT_COMMS_EMAIL_REPLY_TO": $commsReplyTo,
    "CLIENT_INVOICE_VENMO_HANDLE": $venmo,
    "CLIENT_INVOICE_ZELLE_EMAIL": $zelle,
    "CLIENT_INVOICE_ACCESS_SECRET": $accessSecret
  }
  ' "$BRANCH_BEFORE" >"$BRANCH_MERGED"

aws amplify update-branch \
  --app-id "$APP_ID" \
  --branch-name "$BRANCH" \
  --environment-variables "file://${BRANCH_MERGED}" >/dev/null

rm -f "$BRANCH_BEFORE" "$BRANCH_MERGED"

echo "Client comms + invoice env updated on Amplify branch: ${BRANCH}"
echo "  CLIENT_COMMS_EMAIL_FROM=${COMMS_FROM}"
echo "  CLIENT_COMMS_EMAIL_FROM_NAME=${COMMS_FROM_NAME}"
echo "  CLIENT_COMMS_EMAIL_REPLY_TO=${COMMS_REPLY_TO}"
echo "  CLIENT_INVOICE_VENMO_HANDLE=${VENMO_HANDLE}"
echo "  CLIENT_INVOICE_ZELLE_EMAIL=${ZELLE_EMAIL}"
echo "  CLIENT_INVOICE_ACCESS_SECRET=[set]"
echo ""
echo "Redeploy the ${BRANCH} branch in Amplify Console for SSR to pick up changes."
