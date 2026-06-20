#!/usr/bin/env bash
# Grant AWS Console access to manage a specific Amplify app for a Cognito user.
#
# Cognito app login (admin group) is separate from AWS Console / Amplify Hosting.
# This script creates an IAM user and attaches Amplify console permissions.
#
# Usage:
#   COGNITO_SUB=a4c8d428-f0e1-708a-8753-ce8400cda008 \
#     ./infrastructure/aws/scripts/grant-amplify-console-access.sh
#
#   COGNITO_USERNAME=santi_campo ./infrastructure/aws/scripts/grant-amplify-console-access.sh
#
# Optional:
#   IAM_USER_NAME=nurture-amplify-santi-campo
#   TEMP_PASSWORD='ChangeMe!123'   # omit to auto-generate
#   AMPLIFY_APP_ID=d9588bqvrp5xs
#   USE_SCOPED_POLICY=true         # default: AWS managed AdministratorAccess-Amplify
#   CREATE_ACCESS_KEY=true         # for AWS CLI / Cursor agent (secret shown once)
#   DRY_RUN=true
#
set -euo pipefail

REGION="${AWS_REGION:-us-east-1}"
POOL_ID="${COGNITO_USER_POOL_ID:-us-east-1_rUfTimytf}"
APP_ID="${AMPLIFY_APP_ID:-d9588bqvrp5xs}"
USE_SCOPED_POLICY="${USE_SCOPED_POLICY:-false}"
DRY_RUN="${DRY_RUN:-false}"

log() { printf '→ %s\n' "$*"; }
die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

generate_password() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -base64 24 | tr -d '/+=' | head -c 20
    printf 'Aa1!'
  else
    date +%s | shasum | head -c 16
    printf 'Aa1!'
  fi
}

resolve_cognito_user() {
  if [[ -n "${COGNITO_USERNAME:-}" ]]; then
    aws cognito-idp admin-get-user \
      --user-pool-id "$POOL_ID" \
      --username "$COGNITO_USERNAME" \
      --region "$REGION"
    return
  fi

  [[ -n "${COGNITO_SUB:-}" ]] || die "Set COGNITO_SUB or COGNITO_USERNAME"

  local result username
  result="$(aws cognito-idp list-users \
    --user-pool-id "$POOL_ID" \
    --region "$REGION" \
    --filter "sub = \"${COGNITO_SUB}\"" \
    --output json)"

  local count
  count="$(printf '%s' "$result" | jq '.Users | length')"
  [[ "$count" -eq 1 ]] || die "Expected one Cognito user for sub ${COGNITO_SUB}, found ${count}"

  username="$(printf '%s' "$result" | jq -r '.Users[0].Username')"
  COGNITO_USERNAME="$username"
  aws cognito-idp admin-get-user \
    --user-pool-id "$POOL_ID" \
    --username "$username" \
    --region "$REGION"
}

attr_value() {
  printf '%s' "$1" | jq -r --arg name "$2" '.UserAttributes[] | select(.Name == $name) | .Value'
}

run() {
  if [[ "$DRY_RUN" == "true" ]]; then
    log "[dry-run] $*"
  else
    "$@"
  fi
}

main() {
  command -v jq >/dev/null 2>&1 || die "jq is required"

  log "Resolving Cognito user (pool ${POOL_ID})"
  local cognito_json email name sub
  cognito_json="$(resolve_cognito_user)"
  COGNITO_USERNAME="$(printf '%s' "$cognito_json" | jq -r '.Username')"
  email="$(attr_value "$cognito_json" email)"
  name="$(attr_value "$cognito_json" name)"
  sub="$(attr_value "$cognito_json" sub)"
  [[ -n "$email" ]] || die "Cognito user has no email attribute"

  local iam_user="${IAM_USER_NAME:-nurture-amplify-${COGNITO_USERNAME//_/-}}"
  local account_id
  account_id="$(aws sts get-caller-identity --query Account --output text)"
  local sign_in_url="https://${account_id}.signin.aws.amazon.com/console"
  local temp_password="${TEMP_PASSWORD:-$(generate_password)}"
  local scoped_policy_name="NurtureAmplifyConsole-${APP_ID}"

  log "Cognito user: ${COGNITO_USERNAME} (${email}, sub ${sub})"
  log "IAM user: ${iam_user}"
  log "Amplify app: ${APP_ID}"

  if aws iam get-user --user-name "$iam_user" >/dev/null 2>&1; then
    log "IAM user already exists: ${iam_user}"
  else
    log "Creating IAM user"
    run aws iam create-user \
      --user-name "$iam_user" \
      --tags \
        "Key=Email,Value=${email}" \
        "Key=Name,Value=${name}" \
        "Key=CognitoSub,Value=${sub}" \
        "Key=CognitoUsername,Value=${COGNITO_USERNAME}" \
        "Key=Purpose,Value=amplify-console"
  fi

  if [[ "$USE_SCOPED_POLICY" == "true" ]]; then
    local app_arn="arn:aws:amplify:${REGION}:${account_id}:apps/${APP_ID}"
    local policy_doc
    policy_doc="$(jq -n \
      --arg app "$app_arn" \
      '{
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: "amplify:ListApps",
            Resource: "*"
          },
          {
            Effect: "Allow",
            Action: "amplify:*",
            Resource: [
              $app,
              ($app + "/*")
            ]
          }
        ]
      }')"

    log "Ensuring scoped inline policy ${scoped_policy_name}"
    run aws iam put-user-policy \
      --user-name "$iam_user" \
      --policy-name "$scoped_policy_name" \
      --policy-document "$policy_doc"
  else
    log "Attaching AWS managed policy AdministratorAccess-Amplify"
    run aws iam attach-user-policy \
      --user-name "$iam_user" \
      --policy-arn "arn:aws:iam::aws:policy/AdministratorAccess-Amplify"
  fi

  log "Attaching IAMUserChangePassword (required for first console login password change)"
  run aws iam attach-user-policy \
    --user-name "$iam_user" \
    --policy-arn "arn:aws:iam::aws:policy/IAMUserChangePassword"

  log "Attaching AmplifyBackendDeployFullAccess (branch/backend deploy from console)"
  run aws iam attach-user-policy \
    --user-name "$iam_user" \
    --policy-arn "arn:aws:iam::aws:policy/service-role/AmplifyBackendDeployFullAccess"

  local cdk_ssm_policy
  cdk_ssm_policy="$(jq -n \
    --arg account "$account_id" \
    '{
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: [
            "ssm:GetParameter",
            "ssm:GetParameters",
            "ssm:GetParametersByPath"
          ],
          Resource: ("arn:aws:ssm:*:" + $account + ":parameter/cdk-bootstrap/*")
        },
        {
          Effect: "Allow",
          Action: "ssm:DescribeParameters",
          Resource: "*"
        }
      ]
    }')"
  log "Ensuring CDK bootstrap SSM read policy"
  run aws iam put-user-policy \
    --user-name "$iam_user" \
    --policy-name "NurtureCdkBootstrapRead" \
    --policy-document "$cdk_ssm_policy"

  local cfn_policy
  cfn_policy="$(jq -n \
    --arg account "$account_id" \
    '{
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: [
            "cloudformation:CreateStack",
            "cloudformation:UpdateStack",
            "cloudformation:DeleteStack",
            "cloudformation:DescribeStacks",
            "cloudformation:DescribeStackEvents",
            "cloudformation:DescribeStackResources",
            "cloudformation:GetTemplate",
            "cloudformation:CreateChangeSet",
            "cloudformation:ExecuteChangeSet",
            "cloudformation:DescribeChangeSet",
            "cloudformation:DeleteChangeSet",
            "cloudformation:ListStackResources"
          ],
          Resource: [
            ("arn:aws:cloudformation:*:" + $account + ":stack/CDKToolkit/*"),
            ("arn:aws:cloudformation:*:" + $account + ":stack/amplify-*/*")
          ]
        },
        {
          Effect: "Allow",
          Action: [
            "cloudformation:ValidateTemplate",
            "cloudformation:DescribeStacks"
          ],
          Resource: "*"
        }
      ]
    }')"
  log "Ensuring Amplify/CDK CloudFormation deploy policy"
  run aws iam put-user-policy \
    --user-name "$iam_user" \
    --policy-name "NurtureAmplifyCfnDeploy" \
    --policy-document "$cfn_policy"

  local created_login_profile=false
  if aws iam get-login-profile --user-name "$iam_user" >/dev/null 2>&1; then
    log "Console login profile already exists (password unchanged)"
  else
    log "Creating console login profile (password reset required on first sign-in)"
    run aws iam create-login-profile \
      --user-name "$iam_user" \
      --password "$temp_password" \
      --password-reset-required
    created_login_profile=true
  fi

  cat <<EOF

Amplify console access ready for ${name} <${email}>.

AWS sign-in URL:
  ${sign_in_url}

IAM username:
  ${iam_user}

Amplify app:
  https://${REGION}.console.aws.amazon.com/amplify/home?region=${REGION}#/${APP_ID}

EOF

  if [[ "$created_login_profile" == "true" ]]; then
    printf 'Temporary password (share securely; user must change on first login):\n  %s\n\n' "$temp_password"
  else
    log "Existing login profile kept — reset password manually if needed:"
    log "  aws iam update-login-profile --user-name ${iam_user} --password '...' --password-reset-required"
  fi

  if [[ "${CREATE_ACCESS_KEY:-false}" == "true" ]]; then
    local key_count
    key_count="$(aws iam list-access-keys --user-name "$iam_user" --query 'length(AccessKeyMetadata)' --output text)"
    if [[ "$key_count" -ge 1 ]]; then
      log "Access key already exists for ${iam_user} — create manually if a second key is needed"
    else
      log "Creating IAM access key for AWS CLI / Cursor"
      local key_json access_key_id secret_key
      key_json="$(run aws iam create-access-key --user-name "$iam_user" --output json)"
      if [[ "$DRY_RUN" != "true" ]]; then
        access_key_id="$(printf '%s' "$key_json" | jq -r '.AccessKey.AccessKeyId')"
        secret_key="$(printf '%s' "$key_json" | jq -r '.AccessKey.SecretAccessKey')"
        cat <<EOF
CLI credentials (share securely; shown once):

  AWS_ACCESS_KEY_ID=${access_key_id}
  AWS_SECRET_ACCESS_KEY=${secret_key}
  AWS_REGION=${REGION}

Configure locally:
  aws configure --profile nurture-amplify

Or export for a terminal session:
  export AWS_PROFILE=nurture-amplify

EOF
      fi
    fi
  fi

  log "Note: Cognito admin group controls app access at /admin. Amplify Hosting uses this IAM user."
}

main "$@"
