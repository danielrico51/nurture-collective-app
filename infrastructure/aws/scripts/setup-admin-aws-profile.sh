#!/usr/bin/env bash
# Configure a safe local AWS CLI profile for Nurture Collective admin work.
#
# Usage (interactive):
#   ./infrastructure/aws/scripts/setup-admin-aws-profile.sh
#
# Or non-interactive:
#   AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... \
#     ./infrastructure/aws/scripts/setup-admin-aws-profile.sh nurture-admin
#
# Best practices:
#   - Use an IAM user (NOT root) with MFA on the console login
#   - Prefer a dedicated admin user (e.g. danielrico) over root access keys
#   - Never commit access keys; store only in ~/.aws/credentials
#   - Use AWS_PROFILE=nurture (or nurture-admin) for all infra scripts
#   - Rotate keys if exposed; delete root access keys entirely

set -euo pipefail

PROFILE_NAME="${1:-nurture-admin}"
REGION="${AWS_REGION:-us-east-1}"
ACCOUNT_ID="${AWS_ACCOUNT_ID:-886436941204}"

echo "Setting up AWS CLI profile: ${PROFILE_NAME}"
echo "Region: ${REGION} · Expected account: ${ACCOUNT_ID}"
echo ""

if [[ -n "${AWS_ACCESS_KEY_ID:-}" && -n "${AWS_SECRET_ACCESS_KEY:-}" ]]; then
  aws configure set aws_access_key_id "${AWS_ACCESS_KEY_ID}" --profile "${PROFILE_NAME}"
  aws configure set aws_secret_access_key "${AWS_SECRET_ACCESS_KEY}" --profile "${PROFILE_NAME}"
else
  echo "Enter IAM access key for an admin user (NOT root if avoidable):"
  aws configure --profile "${PROFILE_NAME}"
fi

aws configure set region "${REGION}" --profile "${PROFILE_NAME}"
aws configure set output json --profile "${PROFILE_NAME}"

echo ""
echo "Verifying identity..."
IDENTITY="$(AWS_PROFILE="${PROFILE_NAME}" aws sts get-caller-identity --output json)"
echo "${IDENTITY}" | jq .

ACTUAL_ACCOUNT="$(echo "${IDENTITY}" | jq -r .Account)"
if [[ "${ACTUAL_ACCOUNT}" != "${ACCOUNT_ID}" ]]; then
  echo "Warning: account ${ACTUAL_ACCOUNT} != expected ${ACCOUNT_ID}" >&2
fi

echo ""
echo "Profile ${PROFILE_NAME} is ready."
echo ""
echo "Add to your shell (~/.zshrc):"
echo "  export AWS_PROFILE=${PROFILE_NAME}"
echo "  export AWS_REGION=${REGION}"
echo ""
echo "Quick checks:"
echo "  AWS_PROFILE=${PROFILE_NAME} aws sts get-caller-identity"
echo "  AWS_PROFILE=${PROFILE_NAME} aws iam list-users"
echo ""
echo "Security reminders:"
echo "  - Enable MFA on the IAM user in AWS Console"
echo "  - Do not use root access keys for daily CLI work"
echo "  - Use rotate-amplify-server-access-key.sh for SERVER_AWS_* rotation only"
