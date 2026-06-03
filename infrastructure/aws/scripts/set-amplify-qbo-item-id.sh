#!/usr/bin/env bash
# Set QBO_DEFAULT_ITEM_ID on Amplify.
#
# Usage:
#   QBO_DEFAULT_ITEM_ID=1 ./infrastructure/aws/scripts/set-amplify-qbo-item-id.sh

set -euo pipefail

APP_ID="${AMPLIFY_APP_ID:-d9588bqvrp5xs}"
ITEM_ID="${QBO_DEFAULT_ITEM_ID:-}"

if [[ -z "$ITEM_ID" ]]; then
  echo "Set QBO_DEFAULT_ITEM_ID to the QuickBooks Service item Id." >&2
  exit 1
fi

TMP="${TMPDIR:-/tmp}/amplify-qbo-item-$$.json"
aws amplify get-app --app-id "$APP_ID" --query 'app.environmentVariables' --output json >"${TMP}.before"
jq --arg id "$ITEM_ID" '. + {"QBO_DEFAULT_ITEM_ID": $id}' "${TMP}.before" >"$TMP"
aws amplify update-app --app-id "$APP_ID" --environment-variables "file://${TMP}" >/dev/null
rm -f "${TMP}.before" "$TMP"

echo "Amplify QBO_DEFAULT_ITEM_ID set to ${ITEM_ID}"
echo "Redeploy the dev branch to apply."
