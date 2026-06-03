#!/usr/bin/env bash
# Merge QuickBooks sandbox credentials into Amplify Hosting environment variables.
# Secrets are read from the environment — never pass them on the command line in shared shells.
#
# Usage:
#   export QBO_CLIENT_ID='...'
#   export QBO_CLIENT_SECRET='...'
#   ./infrastructure/aws/scripts/set-amplify-qbo-env.sh
#
# Optional:
#   AMPLIFY_APP_ID=d9588bqvrp5xs
#   QBO_ENVIRONMENT=sandbox

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
APP_ID="${AMPLIFY_APP_ID:-d9588bqvrp5xs}"

if [[ -z "${QBO_CLIENT_ID:-}" || -z "${QBO_CLIENT_SECRET:-}" ]]; then
  echo "Set QBO_CLIENT_ID and QBO_CLIENT_SECRET before running." >&2
  exit 1
fi

TMP_DIR="${TMPDIR:-/tmp}"
BEFORE="${TMP_DIR}/amplify-env-before-$$.json"
MERGED="${TMP_DIR}/amplify-env-merged-$$.json"

aws amplify get-app --app-id "$APP_ID" --query 'app.environmentVariables' --output json >"$BEFORE"

jq \
  --arg id "$QBO_CLIENT_ID" \
  --arg secret "$QBO_CLIENT_SECRET" \
  --arg env "${QBO_ENVIRONMENT:-sandbox}" \
  '
  . + {
    "QBO_ENVIRONMENT": $env,
    "QBO_CLIENT_ID": $id,
    "QBO_CLIENT_SECRET": $secret,
    "QBO_REDIRECT_URI": ((.NEXT_PUBLIC_APP_URL // "https://dev.d9588bqvrp5xs.amplifyapp.com") + "/api/integrations/quickbooks/oauth/callback"),
    "BILLING_SYNC_MODE": (.BILLING_SYNC_MODE // "n8n"),
    "BILLING_PAYMENT_PROVIDER": (.BILLING_PAYMENT_PROVIDER // "stub")
  }
  ' "$BEFORE" >"$MERGED"

aws amplify update-app --app-id "$APP_ID" --environment-variables "file://${MERGED}" >/dev/null

rm -f "$BEFORE" "$MERGED"

echo "QuickBooks env vars updated on Amplify app ${APP_ID}."
echo "  QBO_CLIENT_ID set"
echo "  QBO_CLIENT_SECRET set"
echo "  QBO_REDIRECT_URI derived from NEXT_PUBLIC_APP_URL"
echo ""
echo "Redeploy the dev branch in Amplify Console for SSR to pick up changes."
