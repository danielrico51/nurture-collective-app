#!/usr/bin/env bash
# Create the Cognito "clients" group for app sign-ups (idempotent).
set -euo pipefail

REGION="${AWS_REGION:-us-east-1}"
POOL_ID="${COGNITO_USER_POOL_ID:-us-east-1_rUfTimytf}"
GROUP_NAME="${CLIENTS_COGNITO_GROUP:-clients}"

log() { printf '→ %s\n' "$*"; }

main() {
  log "Ensuring Cognito group exists: $GROUP_NAME (pool $POOL_ID)"

  if aws cognito-idp get-group \
    --group-name "$GROUP_NAME" \
    --user-pool-id "$POOL_ID" \
    --region "$REGION" >/dev/null 2>&1; then
    log "Group already exists: $GROUP_NAME"
    return 0
  fi

  aws cognito-idp create-group \
    --group-name "$GROUP_NAME" \
    --user-pool-id "$POOL_ID" \
    --description "Customer app members added automatically on sign-up" \
    --region "$REGION" >/dev/null

  log "Created group: $GROUP_NAME"
}

main "$@"
