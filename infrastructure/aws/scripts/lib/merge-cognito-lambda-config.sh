#!/usr/bin/env bash
# Build a Cognito --lambda-config value that merges existing triggers with updates.
# Usage: merge_cognito_lambda_config POOL_ID REGION [PreSignUp=arn] [InboundFederationArn=arn] [CustomEmailSenderArn=arn] [KMSKeyARN=arn]
set -euo pipefail

merge_cognito_lambda_config() {
  local pool_id="$1"
  local region="$2"
  shift 2

  local presignup=""
  local inbound_federation_arn=""
  local custom_email_arn=""
  local kms_key_arn=""

  presignup="$(aws cognito-idp describe-user-pool \
    --user-pool-id "$pool_id" \
    --region "$region" \
    --query 'UserPool.LambdaConfig.PreSignUp' \
    --output text 2>/dev/null || true)"
  inbound_federation_arn="$(aws cognito-idp describe-user-pool \
    --user-pool-id "$pool_id" \
    --region "$region" \
    --query 'UserPool.LambdaConfig.InboundFederation.LambdaArn' \
    --output text 2>/dev/null || true)"
  custom_email_arn="$(aws cognito-idp describe-user-pool \
    --user-pool-id "$pool_id" \
    --region "$region" \
    --query 'UserPool.LambdaConfig.CustomEmailSender.LambdaArn' \
    --output text 2>/dev/null || true)"
  kms_key_arn="$(aws cognito-idp describe-user-pool \
    --user-pool-id "$pool_id" \
    --region "$region" \
    --query 'UserPool.LambdaConfig.KMSKeyID' \
    --output text 2>/dev/null || true)"

  [[ "$presignup" == "None" ]] && presignup=""
  [[ "$inbound_federation_arn" == "None" ]] && inbound_federation_arn=""
  [[ "$custom_email_arn" == "None" ]] && custom_email_arn=""
  [[ "$kms_key_arn" == "None" ]] && kms_key_arn=""

  while [[ $# -gt 0 ]]; do
    case "$1" in
      PreSignUp=*)
        presignup="${1#PreSignUp=}"
        ;;
      InboundFederationArn=*)
        inbound_federation_arn="${1#InboundFederationArn=}"
        ;;
      CustomEmailSenderArn=*)
        custom_email_arn="${1#CustomEmailSenderArn=}"
        ;;
      KMSKeyARN=*)
        kms_key_arn="${1#KMSKeyARN=}"
        ;;
    esac
    shift
  done

  local parts=()
  if [[ -n "$presignup" ]]; then
    parts+=("PreSignUp=${presignup}")
  fi
  if [[ -n "$inbound_federation_arn" ]]; then
    parts+=("InboundFederation={LambdaVersion=V1_0,LambdaArn=${inbound_federation_arn}}")
  fi
  if [[ -n "$custom_email_arn" ]]; then
    parts+=("CustomEmailSender={LambdaVersion=V1_0,LambdaArn=${custom_email_arn}}")
  fi
  if [[ -n "$kms_key_arn" ]]; then
    parts+=("KMSKeyID=${kms_key_arn}")
  fi

  if [[ ${#parts[@]} -eq 0 ]]; then
    echo ""
    return 0
  fi

  local IFS=,
  echo "${parts[*]}"
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  merge_cognito_lambda_config "$@"
fi
