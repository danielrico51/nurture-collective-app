#!/usr/bin/env bash
# Set public contact email on Amplify (app + all branches).
#
# Usage:
#   ./infrastructure/aws/scripts/set-amplify-contact-email-env.sh
#
# Optional:
#   NEXT_PUBLIC_CONTACT_EMAIL=info@nesting-place.com
#   AMPLIFY_APP_ID=d9588bqvrp5xs

set -euo pipefail

APP_ID="${AMPLIFY_APP_ID:-d9588bqvrp5xs}"
CONTACT_EMAIL="${NEXT_PUBLIC_CONTACT_EMAIL:-info@nesting-place.com}"

TMP_DIR="${TMPDIR:-/tmp}"
APP_BEFORE="${TMP_DIR}/amplify-app-env-before-$$.json"
APP_MERGED="${TMP_DIR}/amplify-app-env-merged-$$.json"

aws amplify get-app --app-id "$APP_ID" --query 'app.environmentVariables' --output json >"$APP_BEFORE"

jq --arg email "$CONTACT_EMAIL" '. + {"NEXT_PUBLIC_CONTACT_EMAIL": $email}' "$APP_BEFORE" >"$APP_MERGED"

aws amplify update-app --app-id "$APP_ID" --environment-variables "file://${APP_MERGED}" >/dev/null

rm -f "$APP_BEFORE" "$APP_MERGED"

echo "App-level NEXT_PUBLIC_CONTACT_EMAIL=${CONTACT_EMAIL}"

BRANCHES=$(aws amplify list-branches --app-id "$APP_ID" --query 'branches[].branchName' --output text)

for branch in $BRANCHES; do
  BRANCH_BEFORE="${TMP_DIR}/amplify-branch-${branch}-before-$$.json"
  BRANCH_MERGED="${TMP_DIR}/amplify-branch-${branch}-merged-$$.json"

  aws amplify get-branch \
    --app-id "$APP_ID" \
    --branch-name "$branch" \
    --query 'branch.environmentVariables' \
    --output json >"$BRANCH_BEFORE"

  jq --arg email "$CONTACT_EMAIL" '. + {"NEXT_PUBLIC_CONTACT_EMAIL": $email}' "$BRANCH_BEFORE" >"$BRANCH_MERGED"

  aws amplify update-branch \
    --app-id "$APP_ID" \
    --branch-name "$branch" \
    --environment-variables "file://${BRANCH_MERGED}" >/dev/null

  rm -f "$BRANCH_BEFORE" "$BRANCH_MERGED"
  echo "Branch ${branch}: NEXT_PUBLIC_CONTACT_EMAIL=${CONTACT_EMAIL}"
done

echo ""
echo "Redeploy Amplify branches (dev/main) for the change to take effect in builds."
