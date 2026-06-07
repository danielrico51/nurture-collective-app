#!/usr/bin/env bash
# Deprecated — use delegated setup instead (same pattern as Google Tasks).
#
#   npm run setup:concierge-scheduling
#
# Domain-wide delegation acts as admin@nesting-place.com; no calendar ACL share
# to the service account is required.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

cat <<EOF
This script has been replaced.

Run the Tasks-style delegated setup instead:

  gcloud auth login
  gcloud auth application-default login
  npm run setup:concierge-scheduling

That enables Calendar API, reuses nurture-tasks-sync, updates .env.local, and
opens Workspace domain-wide delegation (Calendar + Tasks scopes).

EOF

exec "${ROOT}/infrastructure/google/setup-concierge-scheduling.sh" "$@"
