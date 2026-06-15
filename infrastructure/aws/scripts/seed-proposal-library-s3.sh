#!/usr/bin/env bash
# Upload redacted proposal library entries to S3 (dev-scoped prefix by default).
#
# Usage:
#   ./infrastructure/aws/scripts/seed-proposal-library-s3.sh
#
# Optional:
#   PROPOSAL_LIBRARY_S3_BUCKET=nurture-collective-tasks
#   PROPOSAL_LIBRARY_S3_PREFIX=proposal-library/dev/
#   SEED_FILE=proposal-library-seed/dev/entries.json

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
BUCKET="${PROPOSAL_LIBRARY_S3_BUCKET:-nurture-collective-tasks}"
PREFIX="${PROPOSAL_LIBRARY_S3_PREFIX:-proposal-library/dev/}"
SEED_FILE="${SEED_FILE:-${ROOT}/proposal-library-seed/dev/entries.json}"
REGION="${AWS_REGION:-us-east-1}"

if [[ ! -f "$SEED_FILE" ]]; then
  echo "Seed file not found: $SEED_FILE" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required." >&2
  exit 1
fi

count="$(jq 'length' "$SEED_FILE")"
echo "Uploading ${count} redacted proposal library entries to s3://${BUCKET}/${PREFIX}"

for i in $(seq 0 $((count - 1))); do
  entry="$(jq -c ".[$i]" "$SEED_FILE")"
  service_type="$(echo "$entry" | jq -r '.service_type')"
  key="${PREFIX}${service_type}/proposal.json"
  tmp="$(mktemp)"
  echo "$entry" | jq '.' >"$tmp"
  aws s3 cp "$tmp" "s3://${BUCKET}/${key}" \
    --region "$REGION" \
    --content-type "application/json" \
    --metadata "redacted=true,source=client-contracts-seed"
  rm -f "$tmp"
  echo "  ✓ s3://${BUCKET}/${key}"
done

echo ""
echo "Done. Retrieval on Amplify dev will use proposal-library/dev/* instead of built-in examples."
