#!/usr/bin/env bash
# Configure Google, Facebook, and Sign in with Apple on the existing Cognito user pool.
# Requires AWS CLI credentials with cognito-idp permissions.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="${COGNITO_SOCIAL_ENV:-$ROOT/infrastructure/aws/cognito-social-auth.env}"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

REGION="${AWS_REGION:-us-east-1}"
POOL_ID="${COGNITO_USER_POOL_ID:-us-east-1_rUfTimytf}"
CLIENT_ID="${COGNITO_APP_CLIENT_ID:-4t0uapt8havig5h7jiio9g9os4}"
COGNITO_REDIRECT="${COGNITO_IDP_REDIRECT_URI:-https://us-east-1ruftimytf.auth.us-east-1.amazoncognito.com/oauth2/idpresponse}"

CALLBACK_URLS=(
  "http://localhost:3000/oauth/callback"
  "https://dev.d9588bqvrp5xs.amplifyapp.com/oauth/callback"
  "https://main.d9588bqvrp5xs.amplifyapp.com/oauth/callback"
  "https://d84l1y8p4kdic.cloudfront.net/oauth/callback"
)

LOGOUT_URLS=(
  "http://localhost:3000/"
  "https://dev.d9588bqvrp5xs.amplifyapp.com/"
  "https://main.d9588bqvrp5xs.amplifyapp.com/"
  "https://d84l1y8p4kdic.cloudfront.net/"
)

ATTRIBUTE_MAPPING='email=email,given_name=given_name,family_name=family_name,username=sub'

log() { printf '→ %s\n' "$*"; }
warn() { printf '⚠ %s\n' "$*" >&2; }

provider_exists() {
  local name="$1"
  aws cognito-idp describe-identity-provider \
    --user-pool-id "$POOL_ID" \
    --provider-name "$name" \
    --region "$REGION" \
    >/dev/null 2>&1
}

upsert_google() {
  if [[ -z "${GOOGLE_CLIENT_ID:-}" || -z "${GOOGLE_CLIENT_SECRET:-}" ]]; then
    warn "Skipping Google (set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)"
    return 1
  fi
  local args=(
    --user-pool-id "$POOL_ID"
    --provider-name Google
    --provider-type Google
    --provider-details "client_id=${GOOGLE_CLIENT_ID},client_secret=${GOOGLE_CLIENT_SECRET},authorize_scopes=profile email openid"
    --attribute-mapping "$ATTRIBUTE_MAPPING"
    --region "$REGION"
  )
  if provider_exists Google; then
    log "Updating Google identity provider"
    aws cognito-idp update-identity-provider "${args[@]}"
  else
    log "Creating Google identity provider"
    aws cognito-idp create-identity-provider "${args[@]}"
  fi
}

upsert_facebook() {
  local fb_id="${FACEBOOK_CLIENT_ID:-${FACEBOOK_APP_ID:-}}"
  local fb_secret="${FACEBOOK_CLIENT_SECRET:-${FACEBOOK_APP_SECRET:-}}"
  if [[ -z "$fb_id" || -z "$fb_secret" ]]; then
    warn "Skipping Facebook (set FACEBOOK_CLIENT_ID and FACEBOOK_CLIENT_SECRET)"
    return 1
  fi
  local args=(
    --user-pool-id "$POOL_ID"
    --provider-name Facebook
    --provider-type Facebook
    --provider-details "client_id=${fb_id},client_secret=${fb_secret},authorize_scopes=public_profile,email"
    --attribute-mapping "$ATTRIBUTE_MAPPING"
    --region "$REGION"
  )
  if provider_exists Facebook; then
    log "Updating Facebook identity provider"
    aws cognito-idp update-identity-provider "${args[@]}"
  else
    log "Creating Facebook identity provider"
    aws cognito-idp create-identity-provider "${args[@]}"
  fi
}

upsert_apple() {
  local siwa_client="${SIWA_CLIENT_ID:-${SIWA_SERVICES_ID:-}}"
  if [[ -z "$siwa_client" || -z "${SIWA_TEAM_ID:-}" || -z "${SIWA_KEY_ID:-}" ]]; then
    warn "Skipping Apple (set SIWA_CLIENT_ID, SIWA_TEAM_ID, SIWA_KEY_ID, and SIWA_PRIVATE_KEY_FILE)"
    return 1
  fi
  local private_key=""
  if [[ -n "${SIWA_PRIVATE_KEY_FILE:-}" && -f "$SIWA_PRIVATE_KEY_FILE" ]]; then
    private_key="$(cat "$SIWA_PRIVATE_KEY_FILE")"
  elif [[ -n "${SIWA_PRIVATE_KEY:-}" ]]; then
    private_key="$SIWA_PRIVATE_KEY"
  else
    warn "Skipping Apple (private key missing)"
    return 1
  fi
  # Cognito expects PEM with literal newlines in provider-details
  local escaped_key
  escaped_key="$(printf '%s' "$private_key" | awk '{printf "%s\\n", $0}' | sed 's/\\n$//')"

  local details="client_id=${siwa_client},team_id=${SIWA_TEAM_ID},key_id=${SIWA_KEY_ID},private_key=${escaped_key},authorize_scopes=email name"

  local args=(
    --user-pool-id "$POOL_ID"
    --provider-name SignInWithApple
    --provider-type SignInWithApple
    --provider-details "$details"
    --attribute-mapping "$ATTRIBUTE_MAPPING"
    --region "$REGION"
  )
  if provider_exists SignInWithApple; then
    log "Updating Sign in with Apple identity provider"
    aws cognito-idp update-identity-provider "${args[@]}"
  else
    log "Creating Sign in with Apple identity provider"
    aws cognito-idp create-identity-provider "${args[@]}"
  fi
}

update_app_client() {
  local providers=(COGNITO)
  provider_exists Google && providers+=(Google)
  provider_exists Facebook && providers+=(Facebook)
  provider_exists SignInWithApple && providers+=(SignInWithApple)

  log "Updating app client supported providers: ${providers[*]}"

  aws cognito-idp update-user-pool-client \
    --user-pool-id "$POOL_ID" \
    --client-id "$CLIENT_ID" \
    --region "$REGION" \
    --callback-urls "${CALLBACK_URLS[@]}" \
    --logout-urls "${LOGOUT_URLS[@]}" \
    --allowed-o-auth-flows code \
    --allowed-o-auth-scopes openid email profile phone \
    --allowed-o-auth-flows-user-pool-client \
    --supported-identity-providers "${providers[@]}" \
    --explicit-auth-flows ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_AUTH ALLOW_USER_SRP_AUTH
}

main() {
  log "Cognito social auth setup (pool $POOL_ID)"
  log "IdP redirect URI for Google/Meta/Apple consoles: $COGNITO_REDIRECT"
  echo

  upsert_google || true
  upsert_facebook || true
  upsert_apple || true
  update_app_client

  echo
  log "Done. Restart npm run dev and test /signup/mom"
  if ! provider_exists Google && ! provider_exists Facebook && ! provider_exists SignInWithApple; then
    warn "No federated providers were configured. Copy cognito-social-auth.env.example → cognito-social-auth.env and add OAuth credentials."
  fi
}

main "$@"
