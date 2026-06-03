#!/usr/bin/env bash
# Merge Stripe + gift card payment env into Amplify Hosting (never commit secrets to git).
#
# Usage:
#   export STRIPE_SECRET_KEY='sk_live_...'   # or rk_live_... restricted key
#   export STRIPE_WEBHOOK_SECRET='whsec_...'  # optional until webhook is created
#   ./infrastructure/aws/scripts/set-amplify-stripe-env.sh
#
# Optional:
#   AMPLIFY_APP_ID=d9588bqvrp5xs
#   GIFT_CARD_PAYMENT_PROVIDER=stripe
#   NEXT_PUBLIC_GIFT_CARD_PAYMENTS_ENABLED=true

set -euo pipefail

APP_ID="${AMPLIFY_APP_ID:-d9588bqvrp5xs}"

if [[ -z "${STRIPE_SECRET_KEY:-}" ]]; then
  echo "Set STRIPE_SECRET_KEY before running." >&2
  exit 1
fi

TMP_DIR="${TMPDIR:-/tmp}"
BEFORE="${TMP_DIR}/amplify-env-before-$$.json"
MERGED="${TMP_DIR}/amplify-env-merged-$$.json"

aws amplify get-app --app-id "$APP_ID" --query 'app.environmentVariables' --output json >"$BEFORE"

jq \
  --arg key "$STRIPE_SECRET_KEY" \
  --arg whsec "${STRIPE_WEBHOOK_SECRET:-}" \
  --arg provider "${GIFT_CARD_PAYMENT_PROVIDER:-stripe}" \
  --arg enabled "${NEXT_PUBLIC_GIFT_CARD_PAYMENTS_ENABLED:-true}" \
  --arg publicProvider "${NEXT_PUBLIC_GIFT_CARD_PAYMENT_PROVIDER:-stripe}" \
  '
  . + {
    "STRIPE_SECRET_KEY": $key,
    "STRIPE_WEBHOOK_SECRET": $whsec,
    "GIFT_CARD_PAYMENT_PROVIDER": $provider,
    "NEXT_PUBLIC_GIFT_CARD_PAYMENTS_ENABLED": $enabled,
    "NEXT_PUBLIC_GIFT_CARD_PAYMENT_PROVIDER": $publicProvider
  }
  ' "$BEFORE" >"$MERGED"

aws amplify update-app --app-id "$APP_ID" --environment-variables "file://${MERGED}" >/dev/null

rm -f "$BEFORE" "$MERGED"

echo "Stripe gift card env updated on Amplify app ${APP_ID}."
echo "  STRIPE_SECRET_KEY set"
echo "  GIFT_CARD_PAYMENT_PROVIDER=${GIFT_CARD_PAYMENT_PROVIDER:-stripe}"
echo "  NEXT_PUBLIC_GIFT_CARD_PAYMENTS_ENABLED=${NEXT_PUBLIC_GIFT_CARD_PAYMENTS_ENABLED:-true}"
if [[ -z "${STRIPE_WEBHOOK_SECRET:-}" ]]; then
  echo "  STRIPE_WEBHOOK_SECRET not set — add after creating Stripe webhook"
fi
echo ""
echo "Redeploy the dev branch in Amplify Console."
