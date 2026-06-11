#!/usr/bin/env bash
# Toggle search-engine indexing on Amplify.
#
# Block prod only (recommended — keeps dev crawlable for testing):
#   BLOCK_SEARCH_INDEXING=true AMPLIFY_BRANCHES=main \
#     ./infrastructure/aws/scripts/set-amplify-search-indexing-env.sh
#
# Block all branches + app default:
#   BLOCK_SEARCH_INDEXING=true ./infrastructure/aws/scripts/set-amplify-search-indexing-env.sh
#
# Re-enable when ready to go public:
#   BLOCK_SEARCH_INDEXING=false AMPLIFY_BRANCHES=main \
#     ./infrastructure/aws/scripts/set-amplify-search-indexing-env.sh
#
# Optional:
#   AMPLIFY_APP_ID=d9588bqvrp5xs
#   AMPLIFY_BRANCHES="main dev"   # space-separated; omit to update app + all branches

set -euo pipefail

APP_ID="${AMPLIFY_APP_ID:-d9588bqvrp5xs}"
BLOCKED="${BLOCK_SEARCH_INDEXING:-true}"
VALUE="false"
if [[ "$BLOCKED" == "true" || "$BLOCKED" == "1" || "$BLOCKED" == "yes" ]]; then
  VALUE="true"
fi

TMP_DIR="${TMPDIR:-/tmp}"

update_env_json() {
  local source_file="$1"
  local dest_file="$2"
  jq --arg value "$VALUE" '. + {"NEXT_PUBLIC_BLOCK_SEARCH_INDEXING": $value}' "$source_file" >"$dest_file"
}

if [[ -z "${AMPLIFY_BRANCHES:-}" ]]; then
  APP_BEFORE="${TMP_DIR}/amplify-app-env-before-$$.json"
  APP_MERGED="${TMP_DIR}/amplify-app-env-merged-$$.json"

  aws amplify get-app --app-id "$APP_ID" --query 'app.environmentVariables' --output json >"$APP_BEFORE"
  update_env_json "$APP_BEFORE" "$APP_MERGED"
  aws amplify update-app --app-id "$APP_ID" --environment-variables "file://${APP_MERGED}" >/dev/null
  rm -f "$APP_BEFORE" "$APP_MERGED"
  echo "App-level NEXT_PUBLIC_BLOCK_SEARCH_INDEXING=${VALUE}"

  BRANCHES=$(aws amplify list-branches --app-id "$APP_ID" --query 'branches[].branchName' --output text)
else
  BRANCHES="${AMPLIFY_BRANCHES}"
fi

for branch in $BRANCHES; do
  BRANCH_BEFORE="${TMP_DIR}/amplify-branch-${branch}-before-$$.json"
  BRANCH_MERGED="${TMP_DIR}/amplify-branch-${branch}-merged-$$.json"

  aws amplify get-branch \
    --app-id "$APP_ID" \
    --branch-name "$branch" \
    --query 'branch.environmentVariables' \
    --output json >"$BRANCH_BEFORE"

  update_env_json "$BRANCH_BEFORE" "$BRANCH_MERGED"

  aws amplify update-branch \
    --app-id "$APP_ID" \
    --branch-name "$branch" \
    --environment-variables "file://${BRANCH_MERGED}" >/dev/null

  rm -f "$BRANCH_BEFORE" "$BRANCH_MERGED"
  echo "Branch ${branch}: NEXT_PUBLIC_BLOCK_SEARCH_INDEXING=${VALUE}"
done

echo ""
if [[ "$VALUE" == "true" ]]; then
  echo "Search indexing BLOCKED on: ${BRANCHES}"
  echo "Redeploy those Amplify branches for the build to pick up the flag."
  echo "Verify after deploy: curl -s https://www.nesting-place.com/robots.txt"
else
  echo "Search indexing ENABLED on: ${BRANCHES}"
  echo "Redeploy when ready for crawlers to index again."
fi
