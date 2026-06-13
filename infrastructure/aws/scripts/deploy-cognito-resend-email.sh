#!/usr/bin/env bash
# Route Cognito verification / password emails through Resend (interim until SES production).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
ENV_FILE="${COGNITO_RESEND_ENV:-$ROOT/infrastructure/aws/cognito-resend-email.env}"
REGION="${AWS_REGION:-us-east-1}"
POOL_ID="${COGNITO_USER_POOL_ID:-us-east-1_rUfTimytf}"
ACCOUNT_ID="${AWS_ACCOUNT_ID:-886436941204}"
FUNCTION_NAME="${COGNITO_RESEND_EMAIL_FUNCTION:-nurture-cognito-custom-email-resend}"
ROLE_NAME="${COGNITO_RESEND_EMAIL_ROLE:-nurture-cognito-custom-email-resend-role}"
KMS_ALIAS="${COGNITO_RESEND_KMS_ALIAS:-alias/cognito-custom-email-resend}"
LAMBDA_DIR="$ROOT/infrastructure/aws/lambda/cognito-custom-email-resend"
ZIP_PATH="/tmp/${FUNCTION_NAME}.zip"
PRESIGNUP_ARN="${COGNITO_PRESIGNUP_LAMBDA_ARN:-}"

log() { printf '→ %s\n' "$*"; }

load_env_file() {
  local file="$1"
  [[ -f "$file" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="$(printf '%s' "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ -n "$line" ]] || continue
    [[ "$line" == *"="* ]] || continue
    local key="${line%%=*}"
    local value="${line#*=}"
    key="$(printf '%s' "$key" | sed 's/[[:space:]]*$//')"
    value="$(printf '%s' "$value" | sed 's/^[[:space:]]*//')"
    if ! printenv "$key" >/dev/null 2>&1; then
      export "$key=$value"
    fi
  done <"$file"
}

load_env_file "$ENV_FILE"
load_env_file "$ROOT/.env.local"

if [[ -z "${RESEND_API_KEY:-}" ]]; then
  RESEND_API_KEY="$(aws amplify get-branch \
    --app-id "${AMPLIFY_APP_ID:-d9588bqvrp5xs}" \
    --branch-name "${AMPLIFY_BRANCH:-main}" \
    --region "$REGION" \
    --query 'branch.environmentVariables.RESEND_API_KEY' \
    --output text 2>/dev/null || true)"
  if [[ -n "$RESEND_API_KEY" && "$RESEND_API_KEY" != "None" ]]; then
    export RESEND_API_KEY
    log "Loaded RESEND_API_KEY from Amplify ${AMPLIFY_BRANCH:-main}"
  fi
fi

if [[ -z "${RESEND_API_KEY:-}" ]]; then
  echo "Missing RESEND_API_KEY. Set it in infrastructure/aws/cognito-resend-email.env or .env.local." >&2
  exit 1
fi

RESEND_FROM_EMAIL="${RESEND_FROM_EMAIL:-info@nesting-place.com}"
RESEND_FROM_NAME="${RESEND_FROM_NAME:-The Nesting Place}"
RESEND_REPLY_TO="${RESEND_REPLY_TO:-$RESEND_FROM_EMAIL}"

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

  sleep 8
}

ensure_kms_key() {
  local key_id
  key_id="$(aws kms describe-key --key-id "$KMS_ALIAS" --region "$REGION" --query 'KeyMetadata.Arn' --output text 2>/dev/null || true)"
  if [[ -n "$key_id" && "$key_id" != "None" ]]; then
    KMS_KEY_ARN="$key_id"
    KMS_KEY_ID="$(aws kms describe-key --key-id "$KMS_KEY_ARN" --region "$REGION" --query 'KeyMetadata.KeyId' --output text)"
    log "Using existing KMS key: $KMS_KEY_ARN"
    return
  fi

  log "Creating KMS key for Cognito custom email sender"
  KMS_KEY_ARN="$(aws kms create-key \
    --description "Cognito custom email sender (Resend)" \
    --region "$REGION" \
    --query 'KeyMetadata.Arn' \
    --output text)"
  KMS_KEY_ID="$(aws kms describe-key --key-id "$KMS_KEY_ARN" --region "$REGION" --query 'KeyMetadata.KeyId' --output text)"

  aws kms create-alias \
    --alias-name "$KMS_ALIAS" \
    --target-key-id "$KMS_KEY_ID" \
    --region "$REGION"

  local pool_arn="arn:aws:cognito-idp:${REGION}:${ACCOUNT_ID}:userpool/${POOL_ID}"
  aws kms put-key-policy \
    --key-id "$KMS_KEY_ID" \
    --region "$REGION" \
    --policy "$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Enable IAM User Permissions",
      "Effect": "Allow",
      "Principal": { "AWS": "arn:aws:iam::${ACCOUNT_ID}:root" },
      "Action": "kms:*",
      "Resource": "*"
    },
    {
      "Sid": "Allow Cognito to encrypt codes",
      "Effect": "Allow",
      "Principal": { "Service": "cognito-idp.amazonaws.com" },
      "Action": ["kms:CreateGrant", "kms:DescribeKey"],
      "Resource": "*",
      "Condition": {
        "StringEquals": { "kms:ViaService": "cognito-idp.${REGION}.amazonaws.com" },
        "StringLike": { "kms:EncryptionContext:aws:cognito:userpool_id": "${POOL_ID}" }
      }
    },
    {
      "Sid": "Allow Lambda to decrypt codes",
      "Effect": "Allow",
      "Principal": { "AWS": "arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}" },
      "Action": ["kms:Decrypt", "kms:DescribeKey"],
      "Resource": "*"
    }
  ]
}
EOF
)"
}

grant_lambda_kms_access() {
  local policy_name="${ROLE_NAME}-kms-decrypt"
  aws iam put-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-name "$policy_name" \
    --policy-document "$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["kms:Decrypt", "kms:DescribeKey"],
    "Resource": "${KMS_KEY_ARN}"
  }]
}
EOF
)" \
    --region "$REGION"
}

package_lambda() {
  log "Installing Lambda dependencies"
  (cd "$LAMBDA_DIR" && npm install --omit=dev --silent)
  rm -f "$ZIP_PATH"
  (cd "$LAMBDA_DIR" && zip -qr "$ZIP_PATH" index.mjs package.json node_modules)
}

deploy_lambda() {
  local role_arn="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"
  package_lambda

  local env_json
  env_json="$(jq -nc \
    --arg keyId "$KMS_KEY_ID" \
    --arg keyArn "$KMS_KEY_ARN" \
    --arg resendKey "$RESEND_API_KEY" \
    --arg fromEmail "$RESEND_FROM_EMAIL" \
    --arg fromName "$RESEND_FROM_NAME" \
    --arg replyTo "$RESEND_REPLY_TO" \
    '{
      Variables: {
        KEY_ID: $keyId,
        KEY_ARN: $keyArn,
        RESEND_API_KEY: $resendKey,
        RESEND_FROM_EMAIL: $fromEmail,
        RESEND_FROM_NAME: $fromName,
        RESEND_REPLY_TO: $replyTo
      }
    }')"

  if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" >/dev/null 2>&1; then
    log "Updating Lambda function: $FUNCTION_NAME"
    aws lambda update-function-code \
      --function-name "$FUNCTION_NAME" \
      --zip-file "fileb://${ZIP_PATH}" \
      --region "$REGION" >/dev/null
    aws lambda wait function-updated --function-name "$FUNCTION_NAME" --region "$REGION"
    aws lambda update-function-configuration \
      --function-name "$FUNCTION_NAME" \
      --runtime nodejs20.x \
      --handler index.handler \
      --timeout 15 \
      --environment "$env_json" \
      --region "$REGION" >/dev/null
    aws lambda wait function-updated --function-name "$FUNCTION_NAME" --region "$REGION"
  else
    log "Creating Lambda function: $FUNCTION_NAME"
    aws lambda create-function \
      --function-name "$FUNCTION_NAME" \
      --runtime nodejs20.x \
      --role "$role_arn" \
      --handler index.handler \
      --zip-file "fileb://${ZIP_PATH}" \
      --timeout 15 \
      --environment "$env_json" \
      --region "$REGION" >/dev/null
    aws lambda wait function-active --function-name "$FUNCTION_NAME" --region "$REGION"
  fi
}

attach_to_user_pool() {
  local function_arn="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${FUNCTION_NAME}"
  local pool_arn="arn:aws:cognito-idp:${REGION}:${ACCOUNT_ID}:userpool/${POOL_ID}"
  # shellcheck source=/dev/null
  source "$ROOT/infrastructure/aws/scripts/lib/merge-cognito-lambda-config.sh"

  if [[ -n "$PRESIGNUP_ARN" ]]; then
    log "Using explicit PreSignUp ARN: $PRESIGNUP_ARN"
  fi

  log "Granting Cognito permission to invoke custom email Lambda"
  aws lambda add-permission \
    --function-name "$FUNCTION_NAME" \
    --statement-id "cognito-custom-email-${POOL_ID}" \
    --action lambda:InvokeFunction \
    --principal cognito-idp.amazonaws.com \
    --source-arn "$pool_arn" \
    --region "$REGION" \
    >/dev/null 2>&1 || true

  local lambda_config
  lambda_config="$(merge_cognito_lambda_config \
    "$POOL_ID" \
    "$REGION" \
    ${PRESIGNUP_ARN:+PreSignUp=${PRESIGNUP_ARN}} \
    "CustomEmailSenderArn=${function_arn}" \
    "KMSKeyARN=${KMS_KEY_ARN}")"

  log "Attaching CustomEmailSender + KMS to user pool $POOL_ID (preserving PreSignUp)"
  aws cognito-idp update-user-pool \
    --user-pool-id "$POOL_ID" \
    --auto-verified-attributes email \
    --lambda-config "$lambda_config" \
    --region "$REGION" >/dev/null
}

main() {
  log "Deploy Cognito custom email sender via Resend (pool $POOL_ID)"
  ensure_lambda_role
  ensure_kms_key
  grant_lambda_kms_access
  deploy_lambda
  attach_to_user_pool
  log "Done. Sign-up / password-reset codes now send from ${RESEND_FROM_EMAIL} via Resend."
  log "Ensure ${RESEND_FROM_EMAIL} domain is verified at https://resend.com/domains"
}

main "$@"
