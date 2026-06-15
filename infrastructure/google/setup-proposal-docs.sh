#!/usr/bin/env bash
# Step 3 — Google Doc proposal template setup (dev or prod).
#
# 1. Verifies Docs/Drive delegation (optional template smoke test)
# 2. Creates master template doc when CREATE_TEMPLATE=true
# 3. Pushes GOOGLE_PROPOSAL_* env to Amplify
#
# Usage (dev — create template + push to Amplify):
#   CREATE_TEMPLATE=true AMPLIFY_BRANCH=dev ./infrastructure/google/setup-proposal-docs.sh
#
# Usage (existing template ID):
#   GOOGLE_PROPOSAL_TEMPLATE_DOC_ID=<doc-id> AMPLIFY_BRANCH=dev ./infrastructure/google/setup-proposal-docs.sh
#
# Optional:
#   GOOGLE_PROPOSAL_DRIVE_FOLDER_ID=<drive-folder-id>
#   REDEPLOY=true
#   SKIP_VERIFY=1

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BRANCH="${AMPLIFY_BRANCH:-dev}"
CREATE_TEMPLATE="${CREATE_TEMPLATE:-false}"
REDEPLOY="${REDEPLOY:-false}"
SKIP_VERIFY="${SKIP_VERIFY:-false}"

cd "$ROOT"

echo "=== Nesting Place — Proposal Google Docs setup (${BRANCH}) ==="
echo ""
echo "Workspace Admin prerequisite (one-time):"
echo "  Security → API controls → Domain-wide delegation"
echo "  Service account: nurture-tasks-sync@boxwood-magnet-498623-n4.iam.gserviceaccount.com"
echo "  Add scopes:"
echo "    https://www.googleapis.com/auth/documents"
echo "    https://www.googleapis.com/auth/drive"
echo ""

if [[ "$CREATE_TEMPLATE" == "true" ]]; then
  echo "Creating master proposal template in Google Drive…"
  npm run setup:proposal-google-template | tee /tmp/nurture-proposal-template-create.log
  CREATED_ID="$(grep -E '^  Document ID : ' /tmp/nurture-proposal-template-create.log | sed 's/^  Document ID : //')"
  if [[ -n "$CREATED_ID" ]]; then
    export GOOGLE_PROPOSAL_TEMPLATE_DOC_ID="$CREATED_ID"
    echo ""
    echo "Captured GOOGLE_PROPOSAL_TEMPLATE_DOC_ID=${CREATED_ID}"
  fi
fi

if [[ "$SKIP_VERIFY" != "1" ]]; then
  echo "Running proposal Docs credential verification…"
  npm run verify:proposal-docs
  echo ""
fi

if [[ -z "${GOOGLE_PROPOSAL_TEMPLATE_DOC_ID:-}" ]]; then
  echo "GOOGLE_PROPOSAL_TEMPLATE_DOC_ID is not set."
  echo "Either run with CREATE_TEMPLATE=true or pass an existing template doc ID."
  exit 1
fi

echo "Updating Amplify env on branch: ${BRANCH}"
AMPLIFY_BRANCH="$BRANCH" \
  GOOGLE_PROPOSAL_TEMPLATE_DOC_ID="${GOOGLE_PROPOSAL_TEMPLATE_DOC_ID}" \
  GOOGLE_PROPOSAL_DRIVE_FOLDER_ID="${GOOGLE_PROPOSAL_DRIVE_FOLDER_ID:-}" \
  "$ROOT/infrastructure/aws/scripts/set-amplify-proposals-env.sh"

if [[ "$REDEPLOY" == "true" ]]; then
  APP_ID="${AMPLIFY_APP_ID:-d9588bqvrp5xs}"
  echo "Starting Amplify redeploy on ${BRANCH}…"
  aws amplify start-job --app-id "$APP_ID" --branch-name "$BRANCH" --job-type RELEASE >/dev/null
  echo "Redeploy started."
fi

echo ""
echo "Step 3 complete for ${BRANCH}."
echo "  Template: ${GOOGLE_PROPOSAL_TEMPLATE_DOC_ID}"
echo "  Test: Admin → Leads → Generate proposal → Open Google Doc"
