#!/usr/bin/env bash
# AWS → Google Workload Identity Federation for durable Calendar/Tasks delegation.
# Replaces expiring authorized_user ADC in Amplify with AWS IAM → Google SA impersonation.
#
# Prerequisites:
#   gcloud auth login (admin on boxwood-magnet-498623-n4)
#   aws CLI configured (for account ID)
#
# Usage:
#   ./infrastructure/google/setup-workload-identity-federation.sh
#
# Optional:
#   PROJECT_ID=boxwood-magnet-498623-n4
#   AWS_ACCOUNT_ID=886436941204
#   POOL_ID=nurture-amplify-aws
#   PROVIDER_ID=aws-amplify
#   SA_EMAIL=nurture-tasks-sync@boxwood-magnet-498623-n4.iam.gserviceaccount.com
#   AMPLIFY_COMPUTE_ROLE=NurtureCollectiveAmplifyComputeRole
#   AMPLIFY_SERVER_USER=nurture-collective-amplify-server
#   PUSH_AMPLIFY=true
#   AMPLIFY_BRANCH=main
#   REDEPLOY=true

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PROJECT_ID="${PROJECT_ID:-boxwood-magnet-498623-n4}"
POOL_ID="${POOL_ID:-nurture-amplify-aws}"
PROVIDER_ID="${PROVIDER_ID:-aws-amplify}"
SA_EMAIL="${SA_EMAIL:-nurture-tasks-sync@${PROJECT_ID}.iam.gserviceaccount.com}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-$(aws sts get-caller-identity --query Account --output text 2>/dev/null)}"
AMPLIFY_COMPUTE_ROLE="${AMPLIFY_COMPUTE_ROLE:-NurtureCollectiveAmplifyComputeRole}"
AMPLIFY_SERVER_USER="${AMPLIFY_SERVER_USER:-nurture-collective-amplify-server}"
PUSH_AMPLIFY="${PUSH_AMPLIFY:-true}"
AMPLIFY_BRANCH="${AMPLIFY_BRANCH:-main}"
REDEPLOY="${REDEPLOY:-false}"

log() { printf '→ %s\n' "$*"; }

if [[ -z "$AWS_ACCOUNT_ID" ]]; then
  echo "Set AWS_ACCOUNT_ID or configure aws CLI." >&2
  exit 1
fi

PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
POOL_RESOURCE="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}"
PROVIDER_RESOURCE="${POOL_RESOURCE}/providers/${PROVIDER_ID}"

log "GCP project: ${PROJECT_ID} (${PROJECT_NUMBER})"
log "AWS account: ${AWS_ACCOUNT_ID}"
log "Service account: ${SA_EMAIL}"
log "Allowed AWS identities: ${AMPLIFY_COMPUTE_ROLE}, ${AMPLIFY_SERVER_USER}"
echo

if ! gcloud iam workload-identity-pools describe "$POOL_ID" \
  --location=global --project="$PROJECT_ID" >/dev/null 2>&1; then
  log "Creating workload identity pool ${POOL_ID}"
  gcloud iam workload-identity-pools create "$POOL_ID" \
    --location=global \
    --project="$PROJECT_ID" \
    --display-name="Nurture Amplify AWS"
else
  log "Workload identity pool ${POOL_ID} already exists"
fi

ATTRIBUTE_CONDITION="assertion.account == \"${AWS_ACCOUNT_ID}\" && (assertion.arn.contains(\"${AMPLIFY_COMPUTE_ROLE}\") || assertion.arn.contains(\"${AMPLIFY_SERVER_USER}\"))"

if ! gcloud iam workload-identity-pools providers describe "$PROVIDER_ID" \
  --workload-identity-pool="$POOL_ID" --location=global --project="$PROJECT_ID" >/dev/null 2>&1; then
  log "Creating AWS provider ${PROVIDER_ID}"
  gcloud iam workload-identity-pools providers create-aws "$PROVIDER_ID" \
    --workload-identity-pool="$POOL_ID" \
    --location=global \
    --project="$PROJECT_ID" \
    --account-id="$AWS_ACCOUNT_ID" \
    --attribute-mapping="google.subject=assertion.arn,attribute.aws_account=assertion.account" \
    --attribute-condition="$ATTRIBUTE_CONDITION"
else
  log "Updating AWS provider ${PROVIDER_ID}"
  gcloud iam workload-identity-pools providers update-aws "$PROVIDER_ID" \
    --workload-identity-pool="$POOL_ID" \
    --location=global \
    --project="$PROJECT_ID" \
    --attribute-mapping="google.subject=assertion.arn,attribute.aws_account=assertion.account" \
    --attribute-condition="$ATTRIBUTE_CONDITION"
fi

log "Granting workloadIdentityUser on ${SA_EMAIL}"
gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
  --project="$PROJECT_ID" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/${POOL_RESOURCE}/*" \
  --quiet

echo
log "Workload Identity Federation ready."
echo "  GOOGLE_WORKLOAD_IDENTITY_PROJECT_NUMBER=${PROJECT_NUMBER}"
echo "  GOOGLE_WORKLOAD_IDENTITY_POOL_ID=${POOL_ID}"
echo "  GOOGLE_WORKLOAD_IDENTITY_PROVIDER_ID=${PROVIDER_ID}"
echo "  GOOGLE_WORKLOAD_IDENTITY_SERVICE_ACCOUNT=${SA_EMAIL}"
echo "  GOOGLE_CALENDAR_AUTH_MODE=wif"
echo

if [[ "$PUSH_AMPLIFY" == "true" ]]; then
  GOOGLE_WORKLOAD_IDENTITY_PROJECT_NUMBER="$PROJECT_NUMBER" \
  GOOGLE_WORKLOAD_IDENTITY_POOL_ID="$POOL_ID" \
  GOOGLE_WORKLOAD_IDENTITY_PROVIDER_ID="$PROVIDER_ID" \
  GOOGLE_WORKLOAD_IDENTITY_SERVICE_ACCOUNT="$SA_EMAIL" \
  AMPLIFY_BRANCH="$AMPLIFY_BRANCH" \
  REDEPLOY="$REDEPLOY" \
  "$ROOT/infrastructure/aws/scripts/set-amplify-google-wif-env.sh"
fi

log "Verify from AWS (Amplify compute role or server IAM user):"
echo "  GOOGLE_CALENDAR_AUTH_MODE=wif npm run verify:calendar-deploy"
