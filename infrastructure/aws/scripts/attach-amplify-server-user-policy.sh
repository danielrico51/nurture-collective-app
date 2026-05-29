#!/usr/bin/env bash
# Attach platform S3 policy to the IAM user used when SERVER_AWS_* keys are set in Amplify.
set -euo pipefail

ENV="${1:-dev}"
IAM_USER="${2:-nurture-collective-amplify-server}"
REGION="${AWS_REGION:-us-east-1}"
STACK_NAME="nurture-platform-${ENV}"

POLICY_ARN="$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --region "${REGION}" \
  --query "Stacks[0].Outputs[?OutputKey=='AmplifyPlatformPolicyArn'].OutputValue" \
  --output text)"

if [[ -z "${POLICY_ARN}" || "${POLICY_ARN}" == "None" ]]; then
  echo "Deploy the platform stack first: ./infrastructure/aws/scripts/provision-platform.sh ${ENV}"
  exit 1
fi

echo "Attaching ${POLICY_ARN} to IAM user ${IAM_USER}..."
aws iam attach-user-policy \
  --user-name "${IAM_USER}" \
  --policy-arn "${POLICY_ARN}"

echo "Done. CRM leads API should work without redeploy (keys take effect immediately)."
