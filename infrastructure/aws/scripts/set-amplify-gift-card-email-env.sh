#!/usr/bin/env bash
# Enable gift card emails via AWS SES with optional Resend Plan B failover.
#
# Plan B (while SES production access is pending):
#   1. Verify nesting-place.com (or your from address) at https://resend.com/domains
#   2. export RESEND_API_KEY=re_...
#   3. export GIFT_CARD_EMAIL_PROVIDER=auto   # or resend to skip SES entirely
#
# SES prerequisites (when using ses or auto):
#   aws ses verify-email-identity --email-address "you@gmail.com" --region us-east-1
#
# Usage:
#   export GIFT_CARD_EMAIL_FROM='info@nesting-place.com'
#   export RESEND_API_KEY='re_...'
#   ./infrastructure/aws/scripts/set-amplify-gift-card-email-env.sh
#
# Optional:
#   GIFT_CARD_EMAIL_PROVIDER=auto|ses|resend
#   GIFT_CARD_EMAIL_FROM_NAME='The Nesting Place'
#   GIFT_CARD_EMAIL_REPLY_TO='info@nesting-place.com'
#   GIFT_CARD_FULFILLMENT_EMAIL='info@nesting-place.com'
#   AMPLIFY_APP_ID=d9588bqvrp5xs

set -euo pipefail

APP_ID="${AMPLIFY_APP_ID:-d9588bqvrp5xs}"
EMAIL_PROVIDER="${GIFT_CARD_EMAIL_PROVIDER:-auto}"

if [[ -z "${GIFT_CARD_EMAIL_FROM:-}" ]]; then
  echo "Set GIFT_CARD_EMAIL_FROM (e.g. info@nesting-place.com)." >&2
  exit 1
fi

if [[ "$EMAIL_PROVIDER" == "resend" && -z "${RESEND_API_KEY:-}" ]]; then
  echo "GIFT_CARD_EMAIL_PROVIDER=resend requires RESEND_API_KEY." >&2
  exit 1
fi

if [[ "$EMAIL_PROVIDER" == "auto" && -z "${RESEND_API_KEY:-}" ]]; then
  echo "Warning: RESEND_API_KEY not set — auto mode will only use SES (no Plan B failover)." >&2
fi

TMP="${TMPDIR:-/tmp}/amplify-gift-email-$$.json"
aws amplify get-app --app-id "$APP_ID" --query 'app.environmentVariables' --output json >"${TMP}.before"

jq \
  --arg from "$GIFT_CARD_EMAIL_FROM" \
  --arg fulfillment "${GIFT_CARD_FULFILLMENT_EMAIL:-$GIFT_CARD_EMAIL_FROM}" \
  --arg fromName "${GIFT_CARD_EMAIL_FROM_NAME:-The Nesting Place}" \
  --arg replyTo "${GIFT_CARD_EMAIL_REPLY_TO:-}" \
  --arg provider "$EMAIL_PROVIDER" \
  --arg resendKey "${RESEND_API_KEY:-}" \
  '
  . + {
    "GIFT_CARD_EMAIL_ENABLED": "true",
    "GIFT_CARD_EMAIL_PROVIDER": $provider,
    "GIFT_CARD_EMAIL_FROM": $from,
    "GIFT_CARD_FULFILLMENT_EMAIL": $fulfillment,
    "GIFT_CARD_EMAIL_FROM_NAME": $fromName
  }
  | if $replyTo != "" then . + {"GIFT_CARD_EMAIL_REPLY_TO": $replyTo} else . end
  | if $resendKey != "" then . + {"RESEND_API_KEY": $resendKey} else . end
  ' "${TMP}.before" >"$TMP"

aws amplify update-app --app-id "$APP_ID" --environment-variables "file://${TMP}" >/dev/null
rm -f "${TMP}.before" "$TMP"

echo "Gift card email env updated on Amplify app ${APP_ID}."
echo "  GIFT_CARD_EMAIL_ENABLED=true"
echo "  GIFT_CARD_EMAIL_PROVIDER=${EMAIL_PROVIDER}"
echo "  GIFT_CARD_EMAIL_FROM=${GIFT_CARD_EMAIL_FROM}"
echo "  GIFT_CARD_FULFILLMENT_EMAIL=${GIFT_CARD_FULFILLMENT_EMAIL:-$GIFT_CARD_EMAIL_FROM}"
if [[ -n "${RESEND_API_KEY:-}" ]]; then
  echo "  RESEND_API_KEY=[set]"
else
  echo "  RESEND_API_KEY=[not set]"
fi
echo ""
echo "Redeploy dev after updating sender verification (SES and/or Resend)."
