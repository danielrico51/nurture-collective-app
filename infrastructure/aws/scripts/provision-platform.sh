#!/usr/bin/env bash
# Provision Nurture Collective platform S3 buckets + IAM policies via CloudFormation.
set -euo pipefail

ENV="${1:-dev}"
AMPLIFY_ROLE_NAME="${2:-}"
REGION="${AWS_REGION:-us-east-1}"
STACK_NAME="nurture-platform-${ENV}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE="${SCRIPT_DIR}/../cloudformation/nurture-platform-buckets.yaml"

PARAMS="Environment=${ENV}"
if [[ -n "${AMPLIFY_ROLE_NAME}" ]]; then
  PARAMS="${PARAMS} AmplifyComputeRoleName=${AMPLIFY_ROLE_NAME}"
fi

echo "Deploying stack ${STACK_NAME} in ${REGION} (env=${ENV})..."

aws cloudformation deploy \
  --template-file "${TEMPLATE}" \
  --stack-name "${STACK_NAME}" \
  --parameter-overrides "${PARAMS}" \
  --capabilities CAPABILITY_NAMED_IAM \
  --region "${REGION}" \
  --no-fail-on-empty-changeset

echo ""
echo "Stack outputs:"
aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --region "${REGION}" \
  --query "Stacks[0].Outputs" \
  --output table

echo ""
echo "Next steps:"
if [[ -z "${AMPLIFY_ROLE_NAME}" ]]; then
  echo "  1. Attach AmplifyPlatformPolicyArn to your Amplify compute role:"
  echo "       ./infrastructure/aws/scripts/attach-amplify-s3-policy.sh ${ENV} <role-name>"
  echo "     Or redeploy with the role name:"
  echo "       ./infrastructure/aws/scripts/provision-platform.sh ${ENV} NurtureCollectiveAmplifyComputeRole"
else
  echo "  1. Amplify policy attached to role: ${AMPLIFY_ROLE_NAME}"
fi
echo "  2. Set bucket names in Amplify env vars (see infrastructure/aws/README.md)"
echo "  3. Redeploy the Amplify dev branch after updating env vars"
