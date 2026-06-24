#!/usr/bin/env bash
# Set marketing analytics env vars on Amplify (app + all branches).
#
# Usage:
#   NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-R37JPWC5ZM \
#     ./infrastructure/aws/scripts/set-amplify-analytics-env.sh
#
# Optional:
#   NEXT_PUBLIC_PLAUSIBLE_DOMAIN=nesting-place.com
#   AMPLIFY_APP_ID=d9588bqvrp5xs

set -euo pipefail

APP_ID="${AMPLIFY_APP_ID:-d9588bqvrp5xs}"
GA4_ID="${NEXT_PUBLIC_GA4_MEASUREMENT_ID:-G-R37JPWC5ZM}"
PLAUSIBLE_DOMAIN="${NEXT_PUBLIC_PLAUSIBLE_DOMAIN:-}"

TMP_DIR="${TMPDIR:-/tmp}"
APP_BEFORE="${TMP_DIR}/amplify-app-env-before-$$.json"
APP_MERGED="${TMP_DIR}/amplify-app-env-merged-$$.json"

merge_env() {
  local source_file="$1"
  local dest_file="$2"
  local jq_filter='. + {"NEXT_PUBLIC_GA4_MEASUREMENT_ID": $ga4}'
  if [[ -n "$PLAUSIBLE_DOMAIN" ]]; then
    jq_filter+=' + {"NEXT_PUBLIC_PLAUSIBLE_DOMAIN": $plausible}'
    jq --arg ga4 "$GA4_ID" --arg plausible "$PLAUSIBLE_DOMAIN" "$jq_filter" "$source_file" >"$dest_file"
  else
    jq --arg ga4 "$GA4_ID" "$jq_filter" "$source_file" >"$dest_file"
  fi
}

aws amplify get-app --app-id "$APP_ID" --query 'app.environmentVariables' --output json >"$APP_BEFORE"
merge_env "$APP_BEFORE" "$APP_MERGED"
aws amplify update-app --app-id "$APP_ID" --environment-variables "file://${APP_MERGED}" >/dev/null
rm -f "$APP_BEFORE" "$APP_MERGED"

echo "App-level NEXT_PUBLIC_GA4_MEASUREMENT_ID=${GA4_ID}"
if [[ -n "$PLAUSIBLE_DOMAIN" ]]; then
  echo "App-level NEXT_PUBLIC_PLAUSIBLE_DOMAIN=${PLAUSIBLE_DOMAIN}"
fi

BRANCHES=$(aws amplify list-branches --app-id "$APP_ID" --query 'branches[].branchName' --output text)

for branch in $BRANCHES; do
  BRANCH_BEFORE="${TMP_DIR}/amplify-branch-${branch}-before-$$.json"
  BRANCH_MERGED="${TMP_DIR}/amplify-branch-${branch}-merged-$$.json"

  aws amplify get-branch \
    --app-id "$APP_ID" \
    --branch-name "$branch" \
    --query 'branch.environmentVariables' \
    --output json >"$BRANCH_BEFORE"

  merge_env "$BRANCH_BEFORE" "$BRANCH_MERGED"

  aws amplify update-branch \
    --app-id "$APP_ID" \
    --branch-name "$branch" \
    --environment-variables "file://${BRANCH_MERGED}" >/dev/null

  rm -f "$BRANCH_BEFORE" "$BRANCH_MERGED"
  echo "Branch ${branch}: NEXT_PUBLIC_GA4_MEASUREMENT_ID=${GA4_ID}"
  if [[ -n "$PLAUSIBLE_DOMAIN" ]]; then
    echo "Branch ${branch}: NEXT_PUBLIC_PLAUSIBLE_DOMAIN=${PLAUSIBLE_DOMAIN}"
  fi
done

echo ""
echo "Redeploy Amplify branches for GA4/Plausible to load in production builds."
