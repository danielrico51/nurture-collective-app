#!/usr/bin/env bash
# End-to-end Google reviews setup via CLI (Google Cloud + Amplify).
#
# Prereq: gcloud logged in as a project owner/editor
#   gcloud auth login
#   gcloud config set project boxwood-magnet-498623-n4
#
# Usage (creates Places API key + pushes live reviews to Amplify main):
#   GOOGLE_PLACE_ID='ChIJaQA507vGwokR-w9G0wL_2wA' \
#     ./infrastructure/aws/scripts/setup-google-reviews-cli.sh
#
# Or pass an existing key (skip gcloud key creation):
#   GOOGLE_PLACE_ID='ChIJaQA507vGwokR-w9G0wL_2wA' \
#   GOOGLE_PLACES_API_KEY='AIza...' \
#     ./infrastructure/aws/scripts/setup-google-reviews-cli.sh
#
# Optional:
#   GCP_PROJECT=boxwood-magnet-498623-n4
#   AMPLIFY_BRANCHES=main
#   NEXT_PUBLIC_GOOGLE_REVIEWS_VISIBILITY=public
#   START_AMPLIFY_DEPLOY=true

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
PROJECT="${GCP_PROJECT:-boxwood-magnet-498623-n4}"
PLACE_ID="${GOOGLE_PLACE_ID:-ChIJaQA507vGwokR-w9G0wL_2wA}"
API_KEY="${GOOGLE_PLACES_API_KEY:-}"
VISIBILITY="${NEXT_PUBLIC_GOOGLE_REVIEWS_VISIBILITY:-public}"
BRANCHES="${AMPLIFY_BRANCHES:-main}"
START_DEPLOY="${START_AMPLIFY_DEPLOY:-false}"
APP_ID="${AMPLIFY_APP_ID:-d9588bqvrp5xs}"

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1" >&2
    exit 1
  }
}

require_cmd aws
require_cmd jq
require_cmd curl

create_places_api_key() {
  require_cmd gcloud
  echo "Enabling Places API (New) on ${PROJECT}..."
  gcloud services enable places.googleapis.com --project="$PROJECT"

  local key_resource=""
  key_resource="$(
    gcloud services api-keys create \
      --project="$PROJECT" \
      --display-name="Nesting Place website reviews $(date +%Y-%m-%d)" \
      --api-target=service=places.googleapis.com \
      --format='value(name)' 2>/dev/null || true
  )"

  if [[ -z "$key_resource" || "$key_resource" == *"/operations/"* ]]; then
    echo "Waiting for API key creation..."
    sleep 5
    key_resource="$(
      gcloud services api-keys list \
        --project="$PROJECT" \
        --filter='displayName~"Nesting Place website reviews"' \
        --sort-by=~createTime \
        --limit=1 \
        --format='value(name)'
    )"
  fi

  if [[ -z "$key_resource" ]]; then
    echo "Could not create API key automatically. List existing keys:" >&2
    gcloud services api-keys list --project="$PROJECT" --format='table(name,displayName)' >&2
    echo "Create one in Cloud Console or rerun with GOOGLE_PLACES_API_KEY=..." >&2
    exit 1
  fi

  gcloud services api-keys get-key-string "$key_resource" --project="$PROJECT" --format='value(keyString)'
}

test_places_api() {
  local key="$1"
  echo "Testing Places API for ${PLACE_ID}..."
  local status
  status="$(
    curl -sS -o /tmp/places-test.json -w '%{http_code}' \
      -H "Content-Type: application/json" \
      -H "X-Goog-Api-Key: ${key}" \
      -H "X-Goog-FieldMask: rating,userRatingCount,reviews,googleMapsUri" \
      "https://places.googleapis.com/v1/places/${PLACE_ID}"
  )"

  if [[ "$status" != "200" ]]; then
    echo "Places API test failed (HTTP ${status}):" >&2
    cat /tmp/places-test.json >&2
    exit 1
  fi

  local rating count
  rating="$(jq -r '.rating // "n/a"' /tmp/places-test.json)"
  count="$(jq -r '.userRatingCount // 0' /tmp/places-test.json)"
  echo "Places API OK — rating ${rating}, ${count} reviews"
  rm -f /tmp/places-test.json
}

if [[ -z "$API_KEY" ]]; then
  API_KEY="$(create_places_api_key)"
fi

test_places_api "$API_KEY"

export GOOGLE_PLACE_ID="$PLACE_ID"
export GOOGLE_PLACES_API_KEY="$API_KEY"
export GOOGLE_REVIEWS_MODE=live
export NEXT_PUBLIC_GOOGLE_REVIEWS_VISIBILITY="$VISIBILITY"
export AMPLIFY_BRANCHES="$BRANCHES"

"${ROOT}/infrastructure/aws/scripts/set-amplify-google-reviews-env.sh"

if [[ "$START_DEPLOY" == "true" ]]; then
  echo "Starting Amplify deploy on ${BRANCHES}..."
  for branch in $BRANCHES; do
    aws amplify start-job \
      --app-id "$APP_ID" \
      --branch-name "$branch" \
      --job-type RELEASE >/dev/null
    echo "Deploy started: ${branch}"
  done
fi

echo ""
echo "Done. After Amplify deploy, check:"
echo "  https://www.nesting-place.com/api/reviews"
echo "  https://www.nesting-place.com/for-moms"
