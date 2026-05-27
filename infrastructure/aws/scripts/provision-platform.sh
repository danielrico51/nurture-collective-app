#!/usr/bin/env bash
# Provision Nurture Collective platform S3 buckets + IAM policies via CloudFormation.
set -euo pipefail

ENV="${1:-dev}"
REGION="${AWS_REGION:-us-east-1}"
STACK_NAME="nurture-platform-${ENV}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE="${SCRIPT_DIR}/../cloudformation/nurture-platform-buckets.yaml"

echo "Deploying stack ${STACK_NAME} in ${REGION} (env=${ENV})..."

aws cloudformation deploy \
  --template-file "${TEMPLATE}" \
  --stack-name "${STACK_NAME}" \
  --parameter-overrides "Environment=${ENV}" \
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
echo "  1. Attach AmplifyPlatformPolicyArn to NurtureCollectiveAmplifyComputeRole"
echo "  2. Set bucket names in .env.local / Amplify (see docs/platform/architecture.md)"
echo "  3. Deploy Django backend with BackendApiRoleArn"
