#!/usr/bin/env bash
# Deploy PostConfirmation Lambda so every confirmed app sign-up joins the clients group.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
REGION="${AWS_REGION:-us-east-1}"
POOL_ID="${COGNITO_USER_POOL_ID:-us-east-1_rUfTimytf}"
ACCOUNT_ID="${AWS_ACCOUNT_ID:-886436941204}"
FUNCTION_NAME="${COGNITO_POST_CONFIRMATION_CLIENTS_FUNCTION:-nurture-cognito-post-confirmation-clients-group}"
ROLE_NAME="${COGNITO_POST_CONFIRMATION_CLIENTS_ROLE:-nurture-cognito-post-confirmation-clients-role}"
GROUP_NAME="${CLIENTS_COGNITO_GROUP:-clients}"
LAMBDA_DIR="$ROOT/infrastructure/aws/lambda/cognito-post-confirmation-clients-group"
ZIP_PATH="/tmp/${FUNCTION_NAME}.zip"

log() { printf '→ %s\n' "$*"; }

ensure_clients_group() {
  bash "$ROOT/infrastructure/aws/scripts/create-cognito-clients-group.sh"
}

ensure_lambda_role() {
  if aws iam get-role --role-name "$ROLE_NAME" --region "$REGION" >/dev/null 2>&1; then
    log "IAM role exists: $ROLE_NAME"
  else
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
  fi

  local pool_arn="arn:aws:cognito-idp:${REGION}:${ACCOUNT_ID}:userpool/${POOL_ID}"
  aws iam put-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-name "cognito-admin-add-user-to-group-${POOL_ID}" \
    --policy-document "{
      \"Version\": \"2012-10-17\",
      \"Statement\": [{
        \"Effect\": \"Allow\",
        \"Action\": [\"cognito-idp:AdminAddUserToGroup\"],
        \"Resource\": \"${pool_arn}\"
      }]
    }" \
    --region "$REGION" >/dev/null
}

package_lambda() {
  rm -f "$ZIP_PATH"
  (cd "$LAMBDA_DIR" && npm install --omit=dev --silent)
  (cd "$LAMBDA_DIR" && zip -qr "$ZIP_PATH" index.mjs package.json node_modules)
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
    aws lambda update-function-configuration \
      --function-name "$FUNCTION_NAME" \
      --environment "Variables={CLIENTS_COGNITO_GROUP=${GROUP_NAME}}" \
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
      --environment "Variables={CLIENTS_COGNITO_GROUP=${GROUP_NAME}}" \
      --region "$REGION" >/dev/null
  fi
}

attach_to_user_pool() {
  local function_arn="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${FUNCTION_NAME}"
  local pool_arn="arn:aws:cognito-idp:${REGION}:${ACCOUNT_ID}:userpool/${POOL_ID}"

  log "Granting Cognito permission to invoke Lambda"
  aws lambda add-permission \
    --function-name "$FUNCTION_NAME" \
    --statement-id "cognito-post-confirmation-${POOL_ID}" \
    --action lambda:InvokeFunction \
    --principal cognito-idp.amazonaws.com \
    --source-arn "$pool_arn" \
    --region "$REGION" \
    >/dev/null 2>&1 || true

  log "Attaching PostConfirmation trigger to user pool $POOL_ID (preserving other Lambda triggers)"
  if ! python3 "$ROOT/infrastructure/aws/scripts/lib/update-cognito-lambda-config.py" \
    --pool-id "$POOL_ID" \
    --region "$REGION" \
    "PostConfirmation=${function_arn}"; then
    log "Failed to attach Cognito PostConfirmation trigger via boto3"
    return 1
  fi
}

main() {
  log "Deploy PostConfirmation clients-group Lambda (pool $POOL_ID)"
  ensure_clients_group
  ensure_lambda_role
  deploy_lambda
  attach_to_user_pool
  log "Done. Confirmed sign-ups are added to Cognito group: $GROUP_NAME"
}

main "$@"
