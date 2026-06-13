#!/usr/bin/env bash
# Configure Google Business Profile reviews on Amplify.
#
# Minimum (Maps link only — placeholder reviews until API key is set):
#   GOOGLE_PLACE_ID='ChIJ...' ./infrastructure/aws/scripts/set-amplify-google-reviews-env.sh
#
# Full live reviews on site:
#   GOOGLE_PLACE_ID='ChIJ...' \
#   GOOGLE_PLACES_API_KEY='AIza...' \
#   GOOGLE_REVIEWS_MODE=live \
#   NEXT_PUBLIC_GOOGLE_REVIEWS_VISIBILITY=public \
#   ./infrastructure/aws/scripts/set-amplify-google-reviews-env.sh
#
# Optional:
#   AMPLIFY_APP_ID=d9588bqvrp5xs
#   AMPLIFY_BRANCHES="main"
#   NEXT_PUBLIC_GOOGLE_REVIEWS_URL=https://www.google.com/maps/place/...
#   NEXT_PUBLIC_GOOGLE_REVIEWS_VISIBILITY=off|admin|public
#   GOOGLE_REVIEWS_MODE=placeholder|live

set -euo pipefail

APP_ID="${AMPLIFY_APP_ID:-d9588bqvrp5xs}"
PLACE_ID="${GOOGLE_PLACE_ID:-}"
API_KEY="${GOOGLE_PLACES_API_KEY:-}"
REVIEWS_MODE="${GOOGLE_REVIEWS_MODE:-}"
VISIBILITY="${NEXT_PUBLIC_GOOGLE_REVIEWS_VISIBILITY:-}"
REVIEWS_URL="${NEXT_PUBLIC_GOOGLE_REVIEWS_URL:-}"

if [[ -z "$PLACE_ID" ]]; then
  echo "Set GOOGLE_PLACE_ID (from Google Business Profile / Maps)." >&2
  exit 1
fi

if [[ -z "$REVIEWS_URL" ]]; then
  REVIEWS_URL="https://www.google.com/maps/place/?q=place_id:${PLACE_ID}"
fi

TMP_DIR="${TMPDIR:-/tmp}"

update_env_json() {
  local source_file="$1"
  local dest_file="$2"
  jq \
    --arg placeId "$PLACE_ID" \
    --arg reviewsUrl "$REVIEWS_URL" \
    --arg apiKey "$API_KEY" \
    --arg mode "$REVIEWS_MODE" \
    --arg visibility "$VISIBILITY" \
    '
    . + {
      "GOOGLE_PLACE_ID": $placeId,
      "NEXT_PUBLIC_GOOGLE_REVIEWS_URL": $reviewsUrl
    }
    | if $apiKey != "" then . + {"GOOGLE_PLACES_API_KEY": $apiKey} else . end
    | if $mode != "" then . + {"GOOGLE_REVIEWS_MODE": $mode} else . end
    | if $visibility != "" then . + {"NEXT_PUBLIC_GOOGLE_REVIEWS_VISIBILITY": $visibility} else . end
    ' "$source_file" >"$dest_file"
}

if [[ -z "${AMPLIFY_BRANCHES:-}" ]]; then
  BRANCHES=$(aws amplify list-branches --app-id "$APP_ID" --query 'branches[].branchName' --output text)
else
  BRANCHES="${AMPLIFY_BRANCHES}"
fi

for branch in $BRANCHES; do
  BRANCH_BEFORE="${TMP_DIR}/amplify-branch-${branch}-reviews-before-$$.json"
  BRANCH_MERGED="${TMP_DIR}/amplify-branch-${branch}-reviews-merged-$$.json"

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
  echo "Branch ${branch}: GOOGLE_PLACE_ID=${PLACE_ID}"
  echo "Branch ${branch}: NEXT_PUBLIC_GOOGLE_REVIEWS_URL=${REVIEWS_URL}"
  [[ -n "$API_KEY" ]] && echo "Branch ${branch}: GOOGLE_PLACES_API_KEY=[set]"
  [[ -n "$REVIEWS_MODE" ]] && echo "Branch ${branch}: GOOGLE_REVIEWS_MODE=${REVIEWS_MODE}"
  [[ -n "$VISIBILITY" ]] && echo "Branch ${branch}: NEXT_PUBLIC_GOOGLE_REVIEWS_VISIBILITY=${VISIBILITY}"
done

echo ""
if [[ -z "$API_KEY" || "$REVIEWS_MODE" != "live" ]]; then
  echo "Place ID saved. For live reviews on the site, also set:"
  echo "  GOOGLE_PLACES_API_KEY (Google Cloud → Places API New)"
  echo "  GOOGLE_REVIEWS_MODE=live"
  echo "  NEXT_PUBLIC_GOOGLE_REVIEWS_VISIBILITY=public"
fi
echo "Redeploy Amplify after updating env vars."
