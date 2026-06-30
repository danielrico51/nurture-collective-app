#!/usr/bin/env bash
# Set QuickBooks income-routing service item IDs on Amplify (app-wide or branch).
#
# Usage (dev + main branches):
#   QBO_BIRTH_SERVICES_ITEM_ID=2 \
#   QBO_POSTPARTUM_SUPPORT_ITEM_ID=3 \
#   QBO_OTHER_OPERATION_INCOME_ITEM_ID=12 \
#   QBO_DEPOSIT_ITEM_ID=5 \
#   ./infrastructure/aws/scripts/set-amplify-qbo-income-items.sh
#
# Usage (single branch):
#   AMPLIFY_BRANCH=main QBO_BIRTH_SERVICES_ITEM_ID=2 ... \
#     ./infrastructure/aws/scripts/set-amplify-qbo-income-items.sh
#
# Optional:
#   QBO_DEFAULT_ITEM_ID=1   (fallback when a category item is unset)
#   AMPLIFY_APP_ID=d9588bqvrp5xs

set -euo pipefail

APP_ID="${AMPLIFY_APP_ID:-d9588bqvrp5xs}"
BRANCH="${AMPLIFY_BRANCH:-}"

require_item() {
  local name="$1"
  local value="$2"
  if [[ -z "$value" ]]; then
    echo "Set ${name} before running." >&2
    exit 1
  fi
}

require_item "QBO_BIRTH_SERVICES_ITEM_ID" "${QBO_BIRTH_SERVICES_ITEM_ID:-}"
require_item "QBO_POSTPARTUM_SUPPORT_ITEM_ID" "${QBO_POSTPARTUM_SUPPORT_ITEM_ID:-}"
require_item "QBO_OTHER_OPERATION_INCOME_ITEM_ID" "${QBO_OTHER_OPERATION_INCOME_ITEM_ID:-}"
require_item "QBO_DEPOSIT_ITEM_ID" "${QBO_DEPOSIT_ITEM_ID:-}"

DEFAULT_ITEM_ID="${QBO_DEFAULT_ITEM_ID:-}"

apply_env() {
  local target_label="$1"
  local before_file="$2"
  local merged_file="$3"

  jq \
    --arg birth "$QBO_BIRTH_SERVICES_ITEM_ID" \
    --arg postpartum "$QBO_POSTPARTUM_SUPPORT_ITEM_ID" \
    --arg other "$QBO_OTHER_OPERATION_INCOME_ITEM_ID" \
    --arg deposit "$QBO_DEPOSIT_ITEM_ID" \
    --arg default "$DEFAULT_ITEM_ID" \
    '
    . + {
      "QBO_BIRTH_SERVICES_ITEM_ID": $birth,
      "QBO_POSTPARTUM_SUPPORT_ITEM_ID": $postpartum,
      "QBO_OTHER_OPERATION_INCOME_ITEM_ID": $other,
      "QBO_DEPOSIT_ITEM_ID": $deposit
    }
    | if ($default | length) > 0 then . + {"QBO_DEFAULT_ITEM_ID": $default} else . end
    ' "$before_file" >"$merged_file"

  if [[ "$target_label" == app:* ]]; then
    aws amplify update-app \
      --app-id "$APP_ID" \
      --environment-variables "file://${merged_file}" >/dev/null
    echo "Amplify app ${APP_ID} updated."
  else
    local branch="${target_label#branch:}"
    aws amplify update-branch \
      --app-id "$APP_ID" \
      --branch-name "$branch" \
      --environment-variables "file://${merged_file}" >/dev/null
    echo "Amplify branch ${branch} updated."
  fi

  echo "  QBO_BIRTH_SERVICES_ITEM_ID=${QBO_BIRTH_SERVICES_ITEM_ID}"
  echo "  QBO_POSTPARTUM_SUPPORT_ITEM_ID=${QBO_POSTPARTUM_SUPPORT_ITEM_ID}"
  echo "  QBO_OTHER_OPERATION_INCOME_ITEM_ID=${QBO_OTHER_OPERATION_INCOME_ITEM_ID}"
  echo "  QBO_DEPOSIT_ITEM_ID=${QBO_DEPOSIT_ITEM_ID}"
  if [[ -n "$DEFAULT_ITEM_ID" ]]; then
    echo "  QBO_DEFAULT_ITEM_ID=${DEFAULT_ITEM_ID}"
  fi
}

update_target() {
  local target_label="$1"
  local before_file merged_file
  before_file="$(mktemp)"
  merged_file="$(mktemp)"

  if [[ "$target_label" == app:* ]]; then
    aws amplify get-app \
      --app-id "$APP_ID" \
      --query 'app.environmentVariables' \
      --output json >"$before_file"
  else
    local branch="${target_label#branch:}"
    aws amplify get-branch \
      --app-id "$APP_ID" \
      --branch-name "$branch" \
      --query 'branch.environmentVariables' \
      --output json >"$before_file"
  fi

  apply_env "$target_label" "$before_file" "$merged_file"
  rm -f "$before_file" "$merged_file"
}

if [[ -n "$BRANCH" ]]; then
  update_target "branch:${BRANCH}"
else
  update_target "branch:dev"
  update_target "branch:main"
fi

echo ""
echo "Redeploy affected branch(es) in Amplify Console for SSR to pick up changes."
