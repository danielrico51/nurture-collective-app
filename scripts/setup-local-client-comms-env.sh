#!/usr/bin/env bash
# Merge client CRM email + invoice env from Amplify dev into .env.local for local testing.
#
# Prerequisites: AWS CLI authenticated, Amplify dev branch has email vars set.
#   AMPLIFY_BRANCH=dev ./infrastructure/aws/scripts/set-amplify-gift-card-email-env.sh
#   AMPLIFY_BRANCH=dev ./infrastructure/aws/scripts/set-amplify-client-comms-env.sh
#
# Usage:
#   ./scripts/setup-local-client-comms-env.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_LOCAL="${ROOT}/.env.local"
APP_ID="${AMPLIFY_APP_ID:-d9588bqvrp5xs}"
BRANCH="${AMPLIFY_BRANCH:-dev}"

TMP="$(mktemp)"
aws amplify get-branch \
  --app-id "$APP_ID" \
  --branch-name "$BRANCH" \
  --query 'branch.environmentVariables' \
  --output json >"$TMP"

read_var() {
  jq -r --arg key "$1" '.[$key] // empty' "$TMP"
}

GIFT_CARD_EMAIL_ENABLED="$(read_var GIFT_CARD_EMAIL_ENABLED)"
GIFT_CARD_EMAIL_PROVIDER="$(read_var GIFT_CARD_EMAIL_PROVIDER)"
GIFT_CARD_EMAIL_FROM="$(read_var GIFT_CARD_EMAIL_FROM)"
GIFT_CARD_EMAIL_FROM_NAME="$(read_var GIFT_CARD_EMAIL_FROM_NAME)"
GIFT_CARD_EMAIL_REPLY_TO="$(read_var GIFT_CARD_EMAIL_REPLY_TO)"
RESEND_API_KEY="$(read_var RESEND_API_KEY)"
CLIENT_COMMS_EMAIL_FROM="$(read_var CLIENT_COMMS_EMAIL_FROM)"
CLIENT_COMMS_EMAIL_FROM_NAME="$(read_var CLIENT_COMMS_EMAIL_FROM_NAME)"
CLIENT_COMMS_EMAIL_REPLY_TO="$(read_var CLIENT_COMMS_EMAIL_REPLY_TO)"
CLIENT_INVOICE_VENMO_HANDLE="$(read_var CLIENT_INVOICE_VENMO_HANDLE)"
CLIENT_INVOICE_ZELLE_HANDLE="$(read_var CLIENT_INVOICE_ZELLE_HANDLE)"
CLIENT_INVOICE_ZELLE_EMAIL="$(read_var CLIENT_INVOICE_ZELLE_EMAIL)"
CLIENT_INVOICE_ACCESS_SECRET="$(read_var CLIENT_INVOICE_ACCESS_SECRET)"
BILLING_SYNC_MODE="$(read_var BILLING_SYNC_MODE)"
BILLING_PAYMENT_PROVIDER="$(read_var BILLING_PAYMENT_PROVIDER)"
QBO_ENVIRONMENT="$(read_var QBO_ENVIRONMENT)"
QBO_CLIENT_ID="$(read_var QBO_CLIENT_ID)"
QBO_CLIENT_SECRET="$(read_var QBO_CLIENT_SECRET)"
QBO_REDIRECT_URI="$(read_var QBO_REDIRECT_URI)"
QBO_DEFAULT_ITEM_ID="$(read_var QBO_DEFAULT_ITEM_ID)"
QBO_REALM_ID="$(read_var QBO_REALM_ID)"
NEXT_PUBLIC_SITE_URL="$(read_var NEXT_PUBLIC_SITE_URL)"
NEXT_PUBLIC_APP_URL="$(read_var NEXT_PUBLIC_APP_URL)"

if [[ -z "$GIFT_CARD_EMAIL_FROM" && -z "$CLIENT_COMMS_EMAIL_FROM" ]]; then
  echo "Amplify branch ${BRANCH} has no email sender configured." >&2
  echo "Run set-amplify-gift-card-email-env.sh first." >&2
  exit 1
fi

BLOCK="# --- Client CRM email + invoices (from scripts/setup-local-client-comms-env.sh) ---"
END_BLOCK="# --- end client CRM email ---"
BILLING_BLOCK="# --- Billing + QuickBooks (from scripts/setup-local-client-comms-env.sh) ---"
BILLING_END="# --- end billing + QuickBooks ---"

if [[ -f "$ENV_LOCAL" ]] && grep -q "$BLOCK" "$ENV_LOCAL"; then
  awk -v block="$BLOCK" -v end="$END_BLOCK" '
    $0 == block { skip=1; next }
    $0 == end { skip=0; next }
    !skip { print }
  ' "$ENV_LOCAL" >"${ENV_LOCAL}.tmp"
  mv "${ENV_LOCAL}.tmp" "$ENV_LOCAL"
fi

if [[ -f "$ENV_LOCAL" ]] && grep -q "$BILLING_BLOCK" "$ENV_LOCAL"; then
  awk -v block="$BILLING_BLOCK" -v end="$BILLING_END" '
    $0 == block { skip=1; next }
    $0 == end { skip=0; next }
    !skip { print }
  ' "$ENV_LOCAL" >"${ENV_LOCAL}.tmp"
  mv "${ENV_LOCAL}.tmp" "$ENV_LOCAL"
fi

{
  echo ""
  echo "$BLOCK"
  [[ -n "$NEXT_PUBLIC_SITE_URL" ]] && echo "NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}"
  [[ -n "$NEXT_PUBLIC_APP_URL" ]] && echo "NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}"
  if [[ -z "$NEXT_PUBLIC_SITE_URL" && -z "$NEXT_PUBLIC_APP_URL" ]]; then
    echo "NEXT_PUBLIC_APP_URL=https://dev.d9588bqvrp5xs.amplifyapp.com"
  fi
  echo "GIFT_CARD_EMAIL_ENABLED=${GIFT_CARD_EMAIL_ENABLED:-true}"
  echo "GIFT_CARD_EMAIL_PROVIDER=${GIFT_CARD_EMAIL_PROVIDER:-auto}"
  [[ -n "$GIFT_CARD_EMAIL_FROM" ]] && echo "GIFT_CARD_EMAIL_FROM=${GIFT_CARD_EMAIL_FROM}"
  [[ -n "$GIFT_CARD_EMAIL_FROM_NAME" ]] && echo "GIFT_CARD_EMAIL_FROM_NAME=${GIFT_CARD_EMAIL_FROM_NAME}"
  [[ -n "$GIFT_CARD_EMAIL_REPLY_TO" ]] && echo "GIFT_CARD_EMAIL_REPLY_TO=${GIFT_CARD_EMAIL_REPLY_TO}"
  [[ -n "$RESEND_API_KEY" ]] && echo "RESEND_API_KEY=${RESEND_API_KEY}"
  [[ -n "$CLIENT_COMMS_EMAIL_FROM" ]] && echo "CLIENT_COMMS_EMAIL_FROM=${CLIENT_COMMS_EMAIL_FROM}"
  [[ -n "$CLIENT_COMMS_EMAIL_FROM_NAME" ]] && echo "CLIENT_COMMS_EMAIL_FROM_NAME=${CLIENT_COMMS_EMAIL_FROM_NAME}"
  [[ -n "$CLIENT_COMMS_EMAIL_REPLY_TO" ]] && echo "CLIENT_COMMS_EMAIL_REPLY_TO=${CLIENT_COMMS_EMAIL_REPLY_TO}"
  [[ -n "$CLIENT_INVOICE_VENMO_HANDLE" ]] && echo "CLIENT_INVOICE_VENMO_HANDLE=${CLIENT_INVOICE_VENMO_HANDLE}"
  [[ -n "$CLIENT_INVOICE_ZELLE_HANDLE" ]] && echo "CLIENT_INVOICE_ZELLE_HANDLE=${CLIENT_INVOICE_ZELLE_HANDLE}"
  [[ -n "$CLIENT_INVOICE_ZELLE_EMAIL" ]] && echo "CLIENT_INVOICE_ZELLE_EMAIL=${CLIENT_INVOICE_ZELLE_EMAIL}"
  [[ -n "$CLIENT_INVOICE_ACCESS_SECRET" ]] && echo "CLIENT_INVOICE_ACCESS_SECRET=${CLIENT_INVOICE_ACCESS_SECRET}"
  echo "$END_BLOCK"
  echo ""
  echo "$BILLING_BLOCK"
  echo "BILLING_SYNC_MODE=${BILLING_SYNC_MODE:-direct}"
  echo "BILLING_PAYMENT_PROVIDER=${BILLING_PAYMENT_PROVIDER:-stub}"
  [[ -n "$QBO_ENVIRONMENT" ]] && echo "QBO_ENVIRONMENT=${QBO_ENVIRONMENT}"
  [[ -n "$QBO_CLIENT_ID" ]] && echo "QBO_CLIENT_ID=${QBO_CLIENT_ID}"
  [[ -n "$QBO_CLIENT_SECRET" ]] && echo "QBO_CLIENT_SECRET=${QBO_CLIENT_SECRET}"
  [[ -n "$QBO_REDIRECT_URI" ]] && echo "QBO_REDIRECT_URI=${QBO_REDIRECT_URI}"
  [[ -n "$QBO_DEFAULT_ITEM_ID" ]] && echo "QBO_DEFAULT_ITEM_ID=${QBO_DEFAULT_ITEM_ID}"
  [[ -n "$QBO_REALM_ID" ]] && echo "QBO_REALM_ID=${QBO_REALM_ID}"
  echo "$BILLING_END"
} >>"$ENV_LOCAL"

rm -f "$TMP"

echo "Updated ${ENV_LOCAL} with client email + billing vars from Amplify ${BRANCH}."
echo "Restart \`npm run dev\` if it is already running."
