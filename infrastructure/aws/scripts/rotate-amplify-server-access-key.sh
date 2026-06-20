#!/usr/bin/env bash
# Rotate SERVER_AWS_* keys for Amplify SSR (nurture-collective-amplify-server).
#
# Usage:
#   AWS_PROFILE=nurture ./infrastructure/aws/scripts/rotate-amplify-server-access-key.sh
#
# Optional:
#   AMPLIFY_APP_ID=d9588bqvrp5xs
#   IAM_USER=nurture-collective-amplify-server
#   OLD_ACCESS_KEY_ID=AKIA...          # auto-detected if omitted
#   DEACTIVATE_OLD=true                 # default true after Amplify update
#   START_REDEPLOY=true                 # default true (dev + main)
#   KEY_OUTPUT_FILE=$HOME/.nurture-amplify-server-key.json
#
# Requires: aws, jq, IAM permission to create/update keys on IAM_USER and
#           amplify:UpdateApp / amplify:UpdateBranch / amplify:StartJob

set -euo pipefail

APP_ID="${AMPLIFY_APP_ID:-d9588bqvrp5xs}"
IAM_USER="${IAM_USER:-nurture-collective-amplify-server}"
DEACTIVATE_OLD="${DEACTIVATE_OLD:-true}"
START_REDEPLOY="${START_REDEPLOY:-true}"
KEY_OUTPUT_FILE="${KEY_OUTPUT_FILE:-$HOME/.nurture-amplify-server-key.json}"
TMP_DIR="${TMPDIR:-/tmp}"

if ! aws sts get-caller-identity >/dev/null 2>&1; then
  echo "AWS CLI not authenticated. Set AWS_PROFILE (e.g. export AWS_PROFILE=nurture)." >&2
  exit 1
fi

echo "Caller: $(aws sts get-caller-identity --query Arn --output text)"
echo "Rotating access key for IAM user: ${IAM_USER}"

ACTIVE_KEYS="$(aws iam list-access-keys --user-name "${IAM_USER}" --query 'AccessKeyMetadata[?Status==`Active`].AccessKeyId' --output text)"
ACTIVE_COUNT="$(wc -w <<<"${ACTIVE_KEYS}" | tr -d ' ')"
if [[ "${ACTIVE_COUNT}" -ge 2 ]]; then
  echo "User already has 2 access keys. Delete or deactivate one before creating another." >&2
  echo "Active keys: ${ACTIVE_KEYS}" >&2
  exit 1
fi

OLD_ACCESS_KEY_ID="${OLD_ACCESS_KEY_ID:-${ACTIVE_KEYS%% *}}"
if [[ -z "${OLD_ACCESS_KEY_ID}" || "${OLD_ACCESS_KEY_ID}" == "None" ]]; then
  echo "No active access key found on ${IAM_USER}." >&2
  exit 1
fi

echo "Current active key: ${OLD_ACCESS_KEY_ID}"

CREATE_OUT="$(aws iam create-access-key --user-name "${IAM_USER}")"
NEW_ACCESS_KEY_ID="$(jq -r '.AccessKey.AccessKeyId' <<<"${CREATE_OUT}")"
NEW_SECRET_ACCESS_KEY="$(jq -r '.AccessKey.SecretAccessKey' <<<"${CREATE_OUT}")"

umask 077
jq -n \
  --arg user "${IAM_USER}" \
  --arg id "${NEW_ACCESS_KEY_ID}" \
  --arg secret "${NEW_SECRET_ACCESS_KEY}" \
  --arg old "${OLD_ACCESS_KEY_ID}" \
  --arg created "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
  '{iamUser:$user, accessKeyId:$id, secretAccessKey:$secret, replacedKeyId:$old, createdAt:$created}' \
  >"${KEY_OUTPUT_FILE}"

echo "New key created: ${NEW_ACCESS_KEY_ID}"
echo "Secret saved to: ${KEY_OUTPUT_FILE} (chmod 600 — delete after Amplify redeploy succeeds)"

merge_env() {
  local src_file="$1"
  local dest_file="$2"
  jq \
    --arg id "${NEW_ACCESS_KEY_ID}" \
    --arg secret "${NEW_SECRET_ACCESS_KEY}" \
    '. + {"SERVER_AWS_ACCESS_KEY_ID": $id, "SERVER_AWS_SECRET_ACCESS_KEY": $secret}' \
    "${src_file}" >"${dest_file}"
}

update_app_env() {
  local before="${TMP_DIR}/amplify-app-env-$$.json"
  local merged="${TMP_DIR}/amplify-app-env-merged-$$.json"
  aws amplify get-app --app-id "${APP_ID}" --query 'app.environmentVariables' --output json >"${before}"
  if [[ "$(jq 'type' "${before}")" != '"object"' ]]; then
    echo '{}' >"${before}"
  fi
  merge_env "${before}" "${merged}"
  aws amplify update-app --app-id "${APP_ID}" --environment-variables "file://${merged}" >/dev/null
  rm -f "${before}" "${merged}"
  echo "Updated app-level SERVER_AWS_* on ${APP_ID}"
}

update_branch_env() {
  local branch="$1"
  local before="${TMP_DIR}/amplify-branch-${branch}-env-$$.json"
  local merged="${TMP_DIR}/amplify-branch-${branch}-env-merged-$$.json"
  aws amplify get-branch --app-id "${APP_ID}" --branch-name "${branch}" --query 'branch.environmentVariables' --output json >"${before}"
  if [[ "$(jq 'type' "${before}")" != '"object"' ]]; then
    echo '{}' >"${before}"
  fi
  merge_env "${before}" "${merged}"
  aws amplify update-branch --app-id "${APP_ID}" --branch-name "${branch}" --environment-variables "file://${merged}" >/dev/null
  rm -f "${before}" "${merged}"
  echo "Updated branch ${branch} SERVER_AWS_*"
}

start_redeploy() {
  local branch="$1"
  local job_id
  job_id="$(aws amplify start-job \
    --app-id "${APP_ID}" \
    --branch-name "${branch}" \
    --job-type RELEASE \
    --query 'jobSummary.jobId' --output text)"
  echo "Started redeploy on ${branch} (job ${job_id})"
}

update_app_env
for branch in dev main; do
  if aws amplify get-branch --app-id "${APP_ID}" --branch-name "${branch}" >/dev/null 2>&1; then
    update_branch_env "${branch}"
  else
    echo "Branch ${branch} not found — skipped"
  fi
done

if [[ "${START_REDEPLOY}" == "true" ]]; then
  for branch in dev main; do
    if aws amplify get-branch --app-id "${APP_ID}" --branch-name "${branch}" >/dev/null 2>&1; then
      start_redeploy "${branch}" || echo "Warning: could not start job on ${branch}"
    fi
  done
fi

if [[ "${DEACTIVATE_OLD}" == "true" ]]; then
  aws iam update-access-key \
    --user-name "${IAM_USER}" \
    --access-key-id "${OLD_ACCESS_KEY_ID}" \
    --status Inactive
  echo "Deactivated old key: ${OLD_ACCESS_KEY_ID}"
  echo "After 24–48h of stable production, delete it:"
  echo "  aws iam delete-access-key --user-name ${IAM_USER} --access-key-id ${OLD_ACCESS_KEY_ID}"
fi

echo ""
echo "Next steps:"
echo "  1. Verify Amplify builds succeed (dev + main)."
echo "  2. Smoke-test admin app (S3 reads/writes, email)."
echo "  3. Reply to AWS Support confirming rotation (see docs/platform/aws-compromised-key-response.md)."
echo "  4. Delete ${KEY_OUTPUT_FILE} after confirming redeploy."
echo "  5. Consider removing SERVER_AWS_* and using the Amplify compute role only."
