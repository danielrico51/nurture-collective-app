#!/usr/bin/env bash
# Attach NurtureAmplifyPlatformS3-{env} to the Amplify SSR compute role (or show manual steps).
set -euo pipefail

ENV="${1:-dev}"
ROLE_NAME="${2:-NurtureCollectiveAmplifyComputeRole}"
REGION="${AWS_REGION:-us-east-1}"
STACK_NAME="nurture-platform-${ENV}"

echo "Looking up AmplifyPlatformPolicyArn from stack ${STACK_NAME}..."

POLICY_ARN="$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --region "${REGION}" \
  --query "Stacks[0].Outputs[?OutputKey=='AmplifyPlatformPolicyArn'].OutputValue" \
  --output text)"

if [[ -z "${POLICY_ARN}" || "${POLICY_ARN}" == "None" ]]; then
  echo "Could not find AmplifyPlatformPolicyArn. Deploy the platform stack first:"
  echo "  ./infrastructure/aws/scripts/provision-platform.sh ${ENV}"
  exit 1
fi

LEADS_BUCKET="$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --region "${REGION}" \
  --query "Stacks[0].Outputs[?OutputKey=='LeadsBucketName'].OutputValue" \
  --output text)"

echo "Policy: ${POLICY_ARN}"
echo "Role:   ${ROLE_NAME}"
echo "Leads:  ${LEADS_BUCKET}"
echo ""

if ! aws iam get-role --role-name "${ROLE_NAME}" >/dev/null 2>&1; then
  echo "Role '${ROLE_NAME}' was not found."
  echo ""
  echo "Find your Amplify compute role in AWS Console:"
  echo "  Amplify → your app → Hosting → Compute role (or App settings → IAM roles)"
  echo ""
  echo "Then re-run:"
  echo "  ./infrastructure/aws/scripts/attach-amplify-s3-policy.sh ${ENV} <your-compute-role-name>"
  exit 1
fi

echo "Attaching policy to ${ROLE_NAME}..."
aws iam attach-role-policy \
  --role-name "${ROLE_NAME}" \
  --policy-arn "${POLICY_ARN}"

echo ""
echo "Attached successfully."
echo ""
echo "Verify Amplify environment variables (Hosting → Environment variables), then redeploy:"
echo "  NURTURE_LEADS_BUCKET=${LEADS_BUCKET}"
echo "  TASKS_S3_BUCKET=nurture-collective-tasks"
echo "  INTAKE_S3_BUCKET=nurture-collective-tasks"
echo ""
echo "If SERVER_AWS_ACCESS_KEY_ID is set in Amplify, attach the same policy to that IAM user"
echo "or remove those keys so the compute role credentials are used instead."
