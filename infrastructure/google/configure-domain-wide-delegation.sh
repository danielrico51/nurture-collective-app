#!/usr/bin/env bash
# Open Google Workspace Admin with a pre-filled domain-wide delegation form.
#
# Google does NOT expose domain-wide delegation as a gcloud or Admin SDK API.
# This script is the closest CLI workflow: resolve the service account Client ID,
# build the Admin Console deep link (same pattern GAM uses), and open it.
#
# You must be signed in as a Workspace super admin and click Authorize in the browser.
#
# Usage:
#   ./infrastructure/google/configure-domain-wide-delegation.sh
#
# Optional:
#   GCP_PROJECT=boxwood-magnet-498623-n4
#   SERVICE_ACCOUNT_EMAIL=nurture-tasks-sync@boxwood-magnet-498623-n4.iam.gserviceaccount.com
#   SERVICE_ACCOUNT_CLIENT_ID=104446812720989008018
#   DELEGATED_ADMIN=admin@nesting-place.com
#   OPEN_BROWSER=1   # set to 0 to print URL only

set -euo pipefail

GCP_PROJECT="${GCP_PROJECT:-boxwood-magnet-498623-n4}"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_EMAIL:-nurture-tasks-sync@${GCP_PROJECT}.iam.gserviceaccount.com}"
SERVICE_ACCOUNT_CLIENT_ID="${SERVICE_ACCOUNT_CLIENT_ID:-104446812720989008018}"
DELEGATED_ADMIN="${DELEGATED_ADMIN:-admin@nesting-place.com}"
OPEN_BROWSER="${OPEN_BROWSER:-1}"

# Scopes used by this app (comma-separated, no spaces).
# Add new scopes here when enabling more Google APIs.
REQUIRED_SCOPES=(
  "https://www.googleapis.com/auth/tasks"
  "https://www.googleapis.com/auth/calendar"
)

if command -v gcloud >/dev/null 2>&1; then
  if CLIENT_ID="$(
    gcloud iam service-accounts describe "$SERVICE_ACCOUNT_EMAIL" \
      --project="$GCP_PROJECT" \
      --format='value(uniqueId)' 2>/dev/null
  )" && [[ -n "$CLIENT_ID" ]]; then
    SERVICE_ACCOUNT_CLIENT_ID="$CLIENT_ID"
    echo "Resolved service account Client ID via gcloud: ${SERVICE_ACCOUNT_CLIENT_ID}"
  else
    echo "Using default Client ID (${SERVICE_ACCOUNT_CLIENT_ID})."
    echo "Tip: run 'gcloud auth login' to auto-resolve from ${SERVICE_ACCOUNT_EMAIL}"
  fi
else
  echo "gcloud not found — using default Client ID (${SERVICE_ACCOUNT_CLIENT_ID})."
fi

SCOPE_CSV="$(IFS=,; echo "${REQUIRED_SCOPES[*]}")"
DOMAIN="${DELEGATED_ADMIN#*@}"

ADMIN_URL="https://admin.google.com/ac/owl/domainwidedelegation?clientScopeToAdd=${SCOPE_CSV}&clientIdToAdd=${SERVICE_ACCOUNT_CLIENT_ID}&overwriteClientId=true&dn=${DOMAIN}&authuser=${DELEGATED_ADMIN}"

cat <<EOF

Domain-wide delegation (Workspace Admin — browser required)
=========================================================
Service account : ${SERVICE_ACCOUNT_EMAIL}
Client ID       : ${SERVICE_ACCOUNT_CLIENT_ID}
Delegated user  : ${DELEGATED_ADMIN} (used by the app at runtime, not entered here)
Scopes          :
$(printf '  - %s\n' "${REQUIRED_SCOPES[@]}")

Steps:
  1. Open the URL below as a Workspace super admin.
  2. Confirm "Overwrite existing client ID" is checked.
  3. Click Authorize.
  4. Wait a few minutes, then verify with:
       curl -s https://YOUR_APP/api/scheduling/status

Note: gcloud cannot perform this step — only Workspace Admin can.

EOF

echo "$ADMIN_URL"
echo

if [[ "$OPEN_BROWSER" == "1" ]] && command -v open >/dev/null 2>&1; then
  open "$ADMIN_URL"
  echo "Opened Admin Console in your default browser."
elif [[ "$OPEN_BROWSER" == "1" ]]; then
  echo "Install 'open' (macOS) or paste the URL into a browser manually."
fi
