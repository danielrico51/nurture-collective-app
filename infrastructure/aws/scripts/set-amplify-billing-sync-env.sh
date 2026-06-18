#!/usr/bin/env bash
# Set billing sync mode for CRM service invoices + purchase-order QuickBooks sync.
#
# Usage (dev + main):
#   ./infrastructure/aws/scripts/set-amplify-billing-sync-env.sh
#
# Usage (single branch):
#   AMPLIFY_BRANCH=dev BILLING_SYNC_MODE=direct ./infrastructure/aws/scripts/set-amplify-billing-sync-env.sh
#
# Optional:
#   BILLING_PAYMENT_PROVIDER=stripe   # stub | stripe (Stripe checkout for stripe payment method)
#   AMPLIFY_APP_ID=d9588bqvrp5xs

set -euo pipefail

APP_ID="${AMPLIFY_APP_ID:-d9588bqvrp5xs}"
BRANCH="${AMPLIFY_BRANCH:-}"
SYNC_MODE="${BILLING_SYNC_MODE:-direct}"
PAYMENT_PROVIDER="${BILLING_PAYMENT_PROVIDER:-}"

apply_branch() {
  local branch="$1"
  local tmp_before tmp_merged
  tmp_before="$(mktemp)"
  tmp_merged="$(mktemp)"

  aws amplify get-branch \
    --app-id "$APP_ID" \
    --branch-name "$branch" \
    --query 'branch.environmentVariables' \
    --output json >"$tmp_before"

  if [[ -n "$PAYMENT_PROVIDER" ]]; then
    jq \
      --arg sync "$SYNC_MODE" \
      --arg provider "$PAYMENT_PROVIDER" \
      '. + {"BILLING_SYNC_MODE": $sync, "BILLING_PAYMENT_PROVIDER": $provider}' \
      "$tmp_before" >"$tmp_merged"
  else
    jq \
      --arg sync "$SYNC_MODE" \
      '. + {"BILLING_SYNC_MODE": $sync}' \
      "$tmp_before" >"$tmp_merged"
  fi

  aws amplify update-branch \
    --app-id "$APP_ID" \
    --branch-name "$branch" \
    --environment-variables "file://${tmp_merged}" >/dev/null

  rm -f "$tmp_before" "$tmp_merged"
  echo "Amplify branch ${branch}: BILLING_SYNC_MODE=${SYNC_MODE}"
  if [[ -n "$PAYMENT_PROVIDER" ]]; then
    echo "  BILLING_PAYMENT_PROVIDER=${PAYMENT_PROVIDER}"
  fi
}

if [[ -n "$BRANCH" ]]; then
  apply_branch "$BRANCH"
else
  apply_branch dev
  apply_branch main
fi

echo ""
echo "Redeploy affected branch(es) in Amplify Console for SSR to pick up changes."
