#!/usr/bin/env bash
# Fix gift card Stripe checkout: verify key can create Checkout Sessions, update Amplify, redeploy dev.
#
# Stripe restricted keys (rk_live_...) cannot have permissions changed via API — only Dashboard.
# This script accepts either:
#   - A key that already has Checkout Sessions Write (tested below), or
#   - STRIPE_ADMIN_SECRET_KEY=sk_live_... (standard secret key; recommended for Amplify)
#
# Usage:
#   export STRIPE_ADMIN_SECRET_KEY='sk_live_...'   # if fixing permissions in Dashboard isn't possible
#   ./infrastructure/aws/scripts/fix-stripe-gift-card-checkout.sh
#
# Or after editing the restricted key in Dashboard (Checkout Sessions → Write):
#   export STRIPE_SECRET_KEY='rk_live_...'   # same or updated key
#   ./infrastructure/aws/scripts/fix-stripe-gift-card-checkout.sh
#
# Optional:
#   AMPLIFY_APP_ID=d9588bqvrp5xs
#   AMPLIFY_BRANCH=dev
#   REDEPLOY=true

set -euo pipefail

APP_ID="${AMPLIFY_APP_ID:-d9588bqvrp5xs}"
BRANCH="${AMPLIFY_BRANCH:-dev}"
REDEPLOY="${REDEPLOY:-true}"

KEY="${STRIPE_ADMIN_SECRET_KEY:-${STRIPE_SECRET_KEY:-}}"
if [[ -z "$KEY" ]]; then
  echo "Set STRIPE_ADMIN_SECRET_KEY (sk_live_...) or STRIPE_SECRET_KEY (rk_live_... with Checkout Sessions Write)." >&2
  exit 1
fi

echo "Testing Stripe Checkout Sessions create permission..."
RESULT=$(node -e "
const Stripe = require('stripe');
const stripe = new Stripe(process.argv[1]);
stripe.checkout.sessions.create({
  mode: 'payment',
  line_items: [{
    quantity: 1,
    price_data: {
      currency: 'usd',
      unit_amount: 500,
      product_data: { name: 'Permission test (cancelled)' },
    },
  }],
  success_url: 'https://example.com/success',
  cancel_url: 'https://example.com/cancel',
}).then(s => {
  console.log('OK:' + s.id);
  return stripe.checkout.sessions.expire(s.id);
}).catch(e => {
  console.log('FAIL:' + e.message);
  process.exit(1);
});
" "$KEY" 2>&1) || true

if [[ "$RESULT" != OK:* ]]; then
  echo "$RESULT" >&2
  echo "" >&2
  echo "Stripe key cannot create Checkout Sessions." >&2
  echo "  Dashboard: https://dashboard.stripe.com/apikeys → Edit restricted key → Checkout Sessions → Write" >&2
  echo "  Or: export STRIPE_ADMIN_SECRET_KEY='sk_live_...' and re-run this script." >&2
  exit 1
fi

echo "Stripe key OK (${RESULT#OK:})"

TMP="${TMPDIR:-/tmp}/amplify-stripe-fix-$$.json"
aws amplify get-app --app-id "$APP_ID" --query 'app.environmentVariables' --output json >"$TMP"

WHSEC=$(jq -r '.STRIPE_WEBHOOK_SECRET // ""' "$TMP")
export STRIPE_SECRET_KEY="$KEY"
export STRIPE_WEBHOOK_SECRET="$WHSEC"
export GIFT_CARD_PAYMENT_PROVIDER=stripe
export NEXT_PUBLIC_GIFT_CARD_PAYMENTS_ENABLED=true
export NEXT_PUBLIC_GIFT_CARD_PAYMENT_PROVIDER=stripe

"$(dirname "$0")/set-amplify-stripe-env.sh"

rm -f "$TMP"

if [[ "$REDEPLOY" == "true" ]]; then
  echo "Starting Amplify redeploy for branch ${BRANCH}..."
  JOB=$(aws amplify start-job \
    --app-id "$APP_ID" \
    --branch-name "$BRANCH" \
    --job-type RELEASE \
    --query 'jobSummary.jobId' \
    --output text)
  echo "Release job started: ${JOB}"
  echo "https://console.aws.amazon.com/amplify/home?region=us-east-1#/${APP_ID}/${BRANCH}/${JOB}"
fi

echo "Done. Gift card Pay should work after the deploy finishes."
