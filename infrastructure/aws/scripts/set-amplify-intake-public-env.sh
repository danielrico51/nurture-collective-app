#!/usr/bin/env bash
# Toggle public concierge intake (no sign-in for Request support CTAs).
#
# Enable on prod (default):
#   ./infrastructure/aws/scripts/set-amplify-intake-public-env.sh
#
# Require sign-in for intake again:
#   INTAKE_PUBLIC=false ./infrastructure/aws/scripts/set-amplify-intake-public-env.sh
#
# Optional:
#   AMPLIFY_APP_ID=d9588bqvrp5xs
#   AMPLIFY_BRANCHES="main"   # space-separated; omit for app + all branches

set -euo pipefail

APP_ID="${AMPLIFY_APP_ID:-d9588bqvrp5xs}"
ENABLED="${INTAKE_PUBLIC:-true}"
VALUE="false"
if [[ "$ENABLED" == "true" || "$ENABLED" == "1" || "$ENABLED" == "yes" ]]; then
  VALUE="true"
fi

TMP_DIR="${TMPDIR:-/tmp}"

update_env_json() {
  local source_file="$1"
  local dest_file="$2"
  jq --arg value "$VALUE" \
    '. + {"NEXT_PUBLIC_INTAKE_PUBLIC": $value, "INTAKE_PUBLIC": $value}' \
    "$source_file" >"$dest_file"
}

if [[ -z "${AMPLIFY_BRANCHES:-}" ]]; then
  APP_BEFORE="${TMP_DIR}/amplify-app-env-before-$$.json"
  APP_MERGED="${TMP_DIR}/amplify-app-env-merged-$$.json"

  aws amplify get-app --app-id "$APP_ID" --query 'app.environmentVariables' --output json >"$APP_BEFORE"
  update_env_json "$APP_BEFORE" "$APP_MERGED"
  aws amplify update-app --app-id "$APP_ID" --environment-variables "file://${APP_MERGED}" >/dev/null
  rm -f "$APP_BEFORE" "$APP_MERGED"
  echo "App-level NEXT_PUBLIC_INTAKE_PUBLIC=${VALUE}"
  echo "App-level INTAKE_PUBLIC=${VALUE}"

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
  echo "Branch ${branch}: NEXT_PUBLIC_INTAKE_PUBLIC=${VALUE}"
  echo "Branch ${branch}: INTAKE_PUBLIC=${VALUE}"
done

echo ""
if [[ "$VALUE" == "true" ]]; then
  echo "Public intake ENABLED. Redeploy Amplify for Request support CTAs to skip sign-in."
else
  echo "Public intake DISABLED. Redeploy — CTAs will require sign-in again."
fi
