#!/usr/bin/env bash
# Deploy Cognito PreSignUp Lambda so Google/Facebook/Apple sign-up can satisfy
# required pool attributes (address, phone_number) that federated IdPs do not send.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
REGION="${AWS_REGION:-us-east-1}"
POOL_ID="${COGNITO_USER_POOL_ID:-us-east-1_rUfTimytf}"
ACCOUNT_ID="${AWS_ACCOUNT_ID:-886436941204}"
FUNCTION_NAME="${COGNITO_FEDERATED_PRESIGNUP_FUNCTION:-nurture-cognito-federated-presignup}"
ROLE_NAME="${COGNITO_FEDERATED_PRESIGNUP_ROLE:-nurture-cognito-federated-presignup-role}"
LAMBDA_DIR="$ROOT/infrastructure/aws/lambda/cognito-federated-presignup"
ZIP_PATH="/tmp/${FUNCTION_NAME}.zip"

log() { printf '→ %s\n' "$*"; }

ensure_lambda_role() {
  if aws iam get-role --role-name "$ROLE_NAME" --region "$REGION" >/dev/null 2>&1; then
    log "IAM role exists: $ROLE_NAME"
    return
  fi

  log "Creating IAM role: $ROLE_NAME"
  aws iam create-role \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document '{
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Principal": { "Service": "lambda.amazonaws.com" },
        "Action": "sts:AssumeRole"
      }]
    }' \
    --region "$REGION" >/dev/null

  aws iam attach-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
    --region "$REGION"

  log "Waiting for IAM role to propagate…"
  sleep 10
}

package_lambda() {
  rm -f "$ZIP_PATH"
  (cd "$LAMBDA_DIR" && zip -q "$ZIP_PATH" index.mjs)
}

deploy_lambda() {
  local role_arn="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"
  package_lambda

  if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" >/dev/null 2>&1; then
    log "Updating Lambda function: $FUNCTION_NAME"
    aws lambda update-function-code \
      --function-name "$FUNCTION_NAME" \
      --zip-file "fileb://${ZIP_PATH}" \
      --region "$REGION" >/dev/null
  else
    log "Creating Lambda function: $FUNCTION_NAME"
    aws lambda create-function \
      --function-name "$FUNCTION_NAME" \
      --runtime nodejs20.x \
      --role "$role_arn" \
      --handler index.handler \
      --zip-file "fileb://${ZIP_PATH}" \
      --timeout 10 \
      --region "$REGION" >/dev/null
  fi
}

attach_to_user_pool() {
  local function_arn="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${FUNCTION_NAME}"
  local pool_arn="arn:aws:cognito-idp:${REGION}:${ACCOUNT_ID}:userpool/${POOL_ID}"
  # shellcheck source=/dev/null
  source "$ROOT/infrastructure/aws/scripts/lib/merge-cognito-lambda-config.sh"

  log "Granting Cognito permission to invoke Lambda"
  aws lambda add-permission \
    --function-name "$FUNCTION_NAME" \
    --statement-id "cognito-presignup-${POOL_ID}" \
    --action lambda:InvokeFunction \
    --principal cognito-idp.amazonaws.com \
    --source-arn "$pool_arn" \
    --region "$REGION" \
    >/dev/null 2>&1 || true

  local lambda_config
  lambda_config="$(merge_cognito_lambda_config "$POOL_ID" "$REGION" "PreSignUp=${function_arn}")"

  log "Attaching PreSignUp trigger to user pool $POOL_ID (preserving other Lambda triggers)"
  aws cognito-idp update-user-pool \
    --user-pool-id "$POOL_ID" \
    --lambda-config "$lambda_config" \
    --region "$REGION" >/dev/null
}

sync_google_attribute_mapping() {
  if ! aws cognito-idp describe-identity-provider \
    --user-pool-id "$POOL_ID" \
    --provider-name Google \
    --region "$REGION" >/dev/null 2>&1; then
    log "Google provider not configured; skipping attribute mapping sync"
    return
  fi

  log "Syncing Google attribute mapping (placeholder phone/address from sub/email)"
  aws cognito-idp update-identity-provider \
    --user-pool-id "$POOL_ID" \
    --provider-name Google \
    --region "$REGION" \
    --attribute-mapping email=email,given_name=given_name,family_name=family_name,name=name,username=sub,phone_number=sub,address=email \
    >/dev/null
}

main() {
  log "Deploy federated PreSignUp Lambda (pool $POOL_ID)"
  ensure_lambda_role
  deploy_lambda
  attach_to_user_pool
  sync_google_attribute_mapping
  log "Done. Google sign-up should succeed and redirect to /signup/complete-profile."
}

main "$@"
