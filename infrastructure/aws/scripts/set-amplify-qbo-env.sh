#!/usr/bin/env bash
# Merge QuickBooks credentials into Amplify Hosting environment variables.
# Secrets are read from the environment — never commit them to git.
#
# Usage (app-wide — affects all branches unless branch overrides exist):
#   export QBO_CLIENT_ID='...'
#   export QBO_CLIENT_SECRET='...'
#   export QBO_ENVIRONMENT=production   # or sandbox
#   ./infrastructure/aws/scripts/set-amplify-qbo-env.sh
#
# Usage (single branch override, e.g. main production / dev sandbox):
#   AMPLIFY_BRANCH=main QBO_APP_URL=https://main.d9588bqvrp5xs.amplifyapp.com \
#     QBO_ENVIRONMENT=production QBO_CLIENT_ID=... QBO_CLIENT_SECRET=... \
#     ./infrastructure/aws/scripts/set-amplify-qbo-env.sh
#
# Optional:
#   AMPLIFY_APP_ID=d9588bqvrp5xs

set -euo pipefail

APP_ID="${AMPLIFY_APP_ID:-d9588bqvrp5xs}"
BRANCH="${AMPLIFY_BRANCH:-}"

if [[ -z "${QBO_CLIENT_ID:-}" || -z "${QBO_CLIENT_SECRET:-}" ]]; then
  echo "Set QBO_CLIENT_ID and QBO_CLIENT_SECRET before running." >&2
  exit 1
fi

TMP_DIR="${TMPDIR:-/tmp}"
BEFORE="${TMP_DIR}/amplify-env-before-$$.json"
MERGED="${TMP_DIR}/amplify-env-merged-$$.json"

QBO_ENV="${QBO_ENVIRONMENT:-sandbox}"
BASE_URL="${QBO_APP_URL:-}"

if [[ -n "$BRANCH" ]]; then
  EXISTING=$(aws amplify get-branch --app-id "$APP_ID" --branch-name "$BRANCH" \
    --query 'branch.environmentVariables' --output json 2>/dev/null || echo "null")
  if [[ "$EXISTING" == "null" || "$EXISTING" == "{}" ]]; then
    echo "{}" >"$BEFORE"
  else
    echo "$EXISTING" >"$BEFORE"
  fi
  if [[ -z "$BASE_URL" ]]; then
    BASE_URL=$(aws amplify get-app --app-id "$APP_ID" \
      --query 'app.environmentVariables.NEXT_PUBLIC_APP_URL' --output text 2>/dev/null || true)
    if [[ "$BASE_URL" == "None" || -z "$BASE_URL" ]]; then
      BASE_URL="https://${BRANCH}.d9588bqvrp5xs.amplifyapp.com"
    fi
  fi
else
  aws amplify get-app --app-id "$APP_ID" --query 'app.environmentVariables' --output json >"$BEFORE"
  if [[ -z "$BASE_URL" ]]; then
    BASE_URL=$(jq -r '.NEXT_PUBLIC_APP_URL // "https://dev.d9588bqvrp5xs.amplifyapp.com"' "$BEFORE")
  fi
fi

BASE_URL="${BASE_URL%/}"

jq \
  --arg id "$QBO_CLIENT_ID" \
  --arg secret "$QBO_CLIENT_SECRET" \
  --arg env "$QBO_ENV" \
  --arg base "$BASE_URL" \
  '
  . + {
    "QBO_ENVIRONMENT": $env,
    "QBO_CLIENT_ID": $id,
    "QBO_CLIENT_SECRET": $secret,
    "QBO_REDIRECT_URI": ($base + "/api/integrations/quickbooks/oauth/callback"),
    "BILLING_SYNC_MODE": (.BILLING_SYNC_MODE // "n8n"),
    "BILLING_PAYMENT_PROVIDER": (.BILLING_PAYMENT_PROVIDER // "stub")
  }
  ' "$BEFORE" >"$MERGED"

if [[ -n "$BRANCH" ]]; then
  # Merge branch vars with app vars for a complete branch env payload
  APP_ENV=$(aws amplify get-app --app-id "$APP_ID" --query 'app.environmentVariables' --output json)
  jq -s '.[0] * .[1]' <(echo "$APP_ENV") "$MERGED" >"${MERGED}.full"
  aws amplify update-branch \
    --app-id "$APP_ID" \
    --branch-name "$BRANCH" \
    --environment-variables "file://${MERGED}.full" >/dev/null
  rm -f "${MERGED}.full"
  TARGET="branch ${BRANCH}"
else
  aws amplify update-app --app-id "$APP_ID" --environment-variables "file://${MERGED}" >/dev/null
  TARGET="app ${APP_ID}"
fi

rm -f "$BEFORE" "$MERGED"

echo "QuickBooks env updated on Amplify ${TARGET}."
echo "  QBO_ENVIRONMENT=${QBO_ENV}"
echo "  QBO_REDIRECT_URI=${BASE_URL}/api/integrations/quickbooks/oauth/callback"
echo ""
echo "Redeploy the affected branch(es) in Amplify Console."
