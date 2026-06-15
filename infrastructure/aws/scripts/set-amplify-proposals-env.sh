#!/usr/bin/env bash
# Merge proposal workflow env into Amplify Hosting (branch-specific buckets).
#
# Usage (Amplify dev — test proposals against dev S3):
#   AMPLIFY_BRANCH=dev ./infrastructure/aws/scripts/set-amplify-proposals-env.sh
#
# Usage (production / main):
#   AMPLIFY_BRANCH=main ./infrastructure/aws/scripts/set-amplify-proposals-env.sh
#
# Optional overrides:
#   AMPLIFY_APP_ID=d9588bqvrp5xs
#   GOOGLE_PROPOSAL_TEMPLATE_DOC_ID=<google-doc-id>
#   GOOGLE_PROPOSAL_DRIVE_FOLDER_ID=<drive-folder-id>
#   PROPOSAL_LIBRARY_S3_BUCKET=nurture-collective-tasks
#   OPENAI_API_KEY=sk-...

set -euo pipefail

APP_ID="${AMPLIFY_APP_ID:-d9588bqvrp5xs}"
BRANCH="${AMPLIFY_BRANCH:-dev}"
REGION="${AWS_REGION:-us-east-1}"

case "$BRANCH" in
  main|master|production|prod) PLATFORM_ENV=prod ;;
  *) PLATFORM_ENV=dev ;;
esac

STACK_NAME="nurture-platform-${PLATFORM_ENV}"

CLIENTS_BUCKET="$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --region "${REGION}" \
  --query "Stacks[0].Outputs[?OutputKey=='ClientsBucketName'].OutputValue" \
  --output text 2>/dev/null || true)"

if [[ -z "${CLIENTS_BUCKET}" || "${CLIENTS_BUCKET}" == "None" ]]; then
  echo "Warning: could not read ClientsBucketName from ${STACK_NAME}."
  echo "Set NURTURE_CLIENTS_BUCKET manually after provisioning:"
  echo "  ./infrastructure/aws/scripts/provision-platform.sh ${PLATFORM_ENV}"
  CLIENTS_BUCKET=""
fi

if [[ -z "${PROPOSAL_SIGNATURE_WEBHOOK_SECRET:-}" ]]; then
  PROPOSAL_SIGNATURE_WEBHOOK_SECRET="$(openssl rand -base64 32 | tr -d '\n')"
  echo "Generated PROPOSAL_SIGNATURE_WEBHOOK_SECRET for ${BRANCH}."
fi

LIBRARY_BUCKET="${PROPOSAL_LIBRARY_S3_BUCKET:-nurture-collective-tasks}"
TEMPLATE_DOC_ID="${GOOGLE_PROPOSAL_TEMPLATE_DOC_ID:-}"
DRIVE_FOLDER_ID="${GOOGLE_PROPOSAL_DRIVE_FOLDER_ID:-}"
OPENAI_KEY="${OPENAI_API_KEY:-}"

TMP_DIR="${TMPDIR:-/tmp}"
BRANCH_BEFORE="${TMP_DIR}/amplify-proposals-${BRANCH}-before-$$.json"
BRANCH_MERGED="${TMP_DIR}/amplify-proposals-${BRANCH}-merged-$$.json"

aws amplify get-branch \
  --app-id "$APP_ID" \
  --branch-name "$BRANCH" \
  --query 'branch.environmentVariables' \
  --output json >"$BRANCH_BEFORE"

jq \
  --arg clientsBucket "$CLIENTS_BUCKET" \
  --arg libraryBucket "$LIBRARY_BUCKET" \
  --arg templateDocId "$TEMPLATE_DOC_ID" \
  --arg driveFolderId "$DRIVE_FOLDER_ID" \
  --arg webhookSecret "$PROPOSAL_SIGNATURE_WEBHOOK_SECRET" \
  --arg openaiKey "$OPENAI_KEY" \
  --arg deploymentEnv "$PLATFORM_ENV" \
  '
  . + {
    "PROPOSALS_USE_LOCAL_STORAGE": "false",
    "PROPOSALS_USE_S3": "true",
    "NURTURE_CLIENTS_BUCKET": (if $clientsBucket != "" then $clientsBucket else .NURTURE_CLIENTS_BUCKET // "" end),
    "PROPOSAL_LIBRARY_S3_BUCKET": $libraryBucket,
    "PROPOSAL_SIGNATURE_WEBHOOK_SECRET": $webhookSecret
  }
  | if $templateDocId != "" then . + {"GOOGLE_PROPOSAL_TEMPLATE_DOC_ID": $templateDocId} else . end
  | if $driveFolderId != "" then . + {"GOOGLE_PROPOSAL_DRIVE_FOLDER_ID": $driveFolderId} else . end
  | if $openaiKey != "" then . + {"OPENAI_API_KEY": $openaiKey} else . end
  | if $deploymentEnv == "dev" then . + {"APP_ENV": "dev"} else . + {"APP_ENV": "prod"} end
  ' "$BRANCH_BEFORE" >"$BRANCH_MERGED"

aws amplify update-branch \
  --app-id "$APP_ID" \
  --branch-name "$BRANCH" \
  --environment-variables "file://${BRANCH_MERGED}" >/dev/null

rm -f "$BRANCH_BEFORE" "$BRANCH_MERGED"

echo "Proposal env updated on Amplify branch: ${BRANCH} (platform: ${PLATFORM_ENV})"
echo "  PROPOSALS_USE_LOCAL_STORAGE=false"
echo "  PROPOSALS_USE_S3=true"
if [[ -n "$CLIENTS_BUCKET" ]]; then
  echo "  NURTURE_CLIENTS_BUCKET=${CLIENTS_BUCKET}"
fi
echo "  PROPOSAL_LIBRARY_S3_BUCKET=${LIBRARY_BUCKET}"
echo "  PROPOSAL_SIGNATURE_WEBHOOK_SECRET=set"
if [[ -n "$TEMPLATE_DOC_ID" ]]; then
  echo "  GOOGLE_PROPOSAL_TEMPLATE_DOC_ID=${TEMPLATE_DOC_ID}"
fi
echo ""
if [[ "$BRANCH" == "main" ]]; then
  echo "Production checklist:"
  echo "  1. Merge dev → main, redeploy main."
  echo "  2. Proposal library S3 prefix: proposal-library/ (prod legacy path)."
  echo "  3. Signature webhook: https://www.nesting-place.com/api/proposals/signature/webhook"
  echo "     Header: x-proposal-signature-secret"
else
  echo "Dev checklist:"
  echo "  1. Redeploy the ${BRANCH} branch in Amplify Console."
  echo "  2. Proposal data: s3://${CLIENTS_BUCKET:-nurture-clients-dev-*}/clients/client_id=…/proposals/…"
  echo "  3. Proposal library prefix: proposal-library/dev/ (isolated from prod)."
  echo "  4. Test in Admin → Leads → Generate proposal."
fi
