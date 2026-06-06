#!/usr/bin/env bash
# Enable interim gift card emails via AWS SES from a verified personal address.
#
# Prerequisites (one-time per sender):
#   aws ses verify-email-identity --email-address "you@gmail.com" --region us-east-1
#   # Click the link in the verification email from AWS.
#
# Usage:
#   export GIFT_CARD_EMAIL_FROM='you@gmail.com'
#   export GIFT_CARD_FULFILLMENT_EMAIL='you@gmail.com'   # optional; defaults to FROM
#   ./infrastructure/aws/scripts/set-amplify-gift-card-email-env.sh
#
# Optional:
#   GIFT_CARD_EMAIL_FROM_NAME='The Nesting Place'
#   GIFT_CARD_EMAIL_REPLY_TO='info@nesting-place.com'
#   AMPLIFY_APP_ID=d9588bqvrp5xs

set -euo pipefail

APP_ID="${AMPLIFY_APP_ID:-d9588bqvrp5xs}"

if [[ -z "${GIFT_CARD_EMAIL_FROM:-}" ]]; then
  echo "Set GIFT_CARD_EMAIL_FROM to your verified SES email (e.g. personal Gmail)." >&2
  exit 1
fi

TMP="${TMPDIR:-/tmp}/amplify-gift-email-$$.json"
aws amplify get-app --app-id "$APP_ID" --query 'app.environmentVariables' --output json >"${TMP}.before"

jq \
  --arg from "$GIFT_CARD_EMAIL_FROM" \
  --arg fulfillment "${GIFT_CARD_FULFILLMENT_EMAIL:-$GIFT_CARD_EMAIL_FROM}" \
  --arg fromName "${GIFT_CARD_EMAIL_FROM_NAME:-The Nesting Place}" \
  --arg replyTo "${GIFT_CARD_EMAIL_REPLY_TO:-}" \
  '
  . + {
    "GIFT_CARD_EMAIL_ENABLED": "true",
    "GIFT_CARD_EMAIL_FROM": $from,
    "GIFT_CARD_FULFILLMENT_EMAIL": $fulfillment,
    "GIFT_CARD_EMAIL_FROM_NAME": $fromName
  }
  | if $replyTo != "" then . + {"GIFT_CARD_EMAIL_REPLY_TO": $replyTo} else . end
  ' "${TMP}.before" >"$TMP"

aws amplify update-app --app-id "$APP_ID" --environment-variables "file://${TMP}" >/dev/null
rm -f "${TMP}.before" "$TMP"

echo "Gift card email env updated on Amplify app ${APP_ID}."
echo "  GIFT_CARD_EMAIL_ENABLED=true"
echo "  GIFT_CARD_EMAIL_FROM=${GIFT_CARD_EMAIL_FROM}"
echo "  GIFT_CARD_FULFILLMENT_EMAIL=${GIFT_CARD_FULFILLMENT_EMAIL:-$GIFT_CARD_EMAIL_FROM}"
echo ""
echo "Redeploy dev after SES identity is verified."
