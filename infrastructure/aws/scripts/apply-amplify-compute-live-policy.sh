#!/usr/bin/env bash
# Push policies/nurture-collective-amplify-compute-live.json to the live IAM managed policy.
# Use when Amplify SSR uses the compute role (no SERVER_AWS_* keys).
#
# Usage:
#   ./infrastructure/aws/scripts/apply-amplify-compute-live-policy.sh
#   POLICY_NAME=NurtureCollectiveAmplifyComputePolicy ./infrastructure/aws/scripts/apply-amplify-compute-live-policy.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
POLICY_NAME="${POLICY_NAME:-NurtureCollectiveAmplifyComputePolicy}"
POLICY_DOC="${ROOT}/policies/nurture-collective-amplify-compute-live.json"

if [[ ! -f "${POLICY_DOC}" ]]; then
  echo "Policy document not found: ${POLICY_DOC}" >&2
  exit 1
fi

POLICY_ARN="$(aws iam list-policies --scope Local --query "Policies[?PolicyName=='${POLICY_NAME}'].Arn" --output text)"
if [[ -z "${POLICY_ARN}" || "${POLICY_ARN}" == "None" ]]; then
  echo "IAM policy ${POLICY_NAME} not found in this account." >&2
  exit 1
fi

echo "Updating ${POLICY_NAME} (${POLICY_ARN}) from ${POLICY_DOC}..."
aws iam create-policy-version \
  --policy-arn "${POLICY_ARN}" \
  --policy-document "file://${POLICY_DOC}" \
  --set-as-default >/dev/null

echo "Done. SES + S3 + Cognito statements are now on ${POLICY_NAME}."
echo ""
echo "Note: If Amplify uses SERVER_AWS_ACCESS_KEY_ID, the IAM user also needs ses:SendEmail."
echo "  nurture-collective-amplify-server should have inline policy NurtureSESSendGiftCards."
echo "Redeploy Amplify only if you changed env vars; IAM policy updates apply immediately."
