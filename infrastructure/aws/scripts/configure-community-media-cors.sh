#!/usr/bin/env bash
# Allow browser presigned PUT uploads to COMMUNITY_MEDIA_S3_BUCKET from app origins.
#
# Usage:
#   ./infrastructure/aws/scripts/configure-community-media-cors.sh
#   APP_URL=https://www.nesting-place.com BUCKET=nurture-community-media-dev-886436941204 ./infrastructure/aws/scripts/configure-community-media-cors.sh
set -euo pipefail

REGION="${AWS_REGION:-us-east-1}"
BUCKET="${BUCKET:-${COMMUNITY_MEDIA_S3_BUCKET:-nurture-community-media-dev-886436941204}}"
APP_URL="${APP_URL:-${NEXT_PUBLIC_APP_URL:-https://www.nesting-place.com}}"

normalize_origin() {
  local url="${1%/}"
  printf '%s' "$url"
}

APP_ORIGIN="$(normalize_origin "$APP_URL")"
WWW_ORIGIN=""
if [[ "$APP_ORIGIN" == https://* ]]; then
  host="${APP_ORIGIN#https://}"
  if [[ "$host" == www.* ]]; then
    WWW_ORIGIN="https://${host#www.}"
  else
    WWW_ORIGIN="https://www.${host}"
  fi
fi

origins=(
  "http://localhost:3000"
  "https://dev.d9588bqvrp5xs.amplifyapp.com"
  "https://main.d9588bqvrp5xs.amplifyapp.com"
  "https://d9588bqvrp5xs.amplifyapp.com"
  "$APP_ORIGIN"
)
if [[ -n "$WWW_ORIGIN" && "$WWW_ORIGIN" != "$APP_ORIGIN" ]]; then
  origins+=("$WWW_ORIGIN")
fi

deduped_origins=()
for origin in "${origins[@]}"; do
  [[ -z "$origin" ]] && continue
  seen=false
  for existing in "${deduped_origins[@]:-}"; do
    if [[ "$existing" == "$origin" ]]; then
      seen=true
      break
    fi
  done
  if ! $seen; then
    deduped_origins+=("$origin")
  fi
done

python3 - "$BUCKET" "${deduped_origins[@]}" <<'PY' > /tmp/community-media-cors.json
import json, sys
bucket = sys.argv[1]
origins = sys.argv[2:]
print(json.dumps({
  "CORSRules": [{
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedOrigins": origins,
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000,
  }]
}))
PY

echo "Applying CORS on s3://${BUCKET} for origins:"
printf '  - %s\n' "${deduped_origins[@]}"

aws s3api put-bucket-cors \
  --bucket "$BUCKET" \
  --region "$REGION" \
  --cors-configuration "file:///tmp/community-media-cors.json"

aws s3api get-bucket-cors --bucket "$BUCKET" --region "$REGION" --output json
