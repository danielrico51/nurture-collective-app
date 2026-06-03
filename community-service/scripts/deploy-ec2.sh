#!/usr/bin/env bash
# Sync community-service to EC2, migrate, optional seed, restart daphne.
# Requires: KEYFILE, EIP (or pass EC2_HOST), AWS profile optional.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EC2_USER="${EC2_USER:-ec2-user}"
EC2_HOST="${EC2_HOST:-${EIP:-}}"
KEYFILE="${KEYFILE:-$HOME/.ssh/nurture-community.pem}"
REMOTE_DIR="${REMOTE_DIR:-/opt/nurture/community-service}"
REMOTE_VENV="${REMOTE_VENV:-/opt/nurture/venv}"
RUN_SEED_COHORTS="${RUN_SEED_COHORTS:-1}"

if [[ -z "$EC2_HOST" ]]; then
  echo "Set EIP or EC2_HOST to the Elastic IP." >&2
  exit 1
fi
if [[ ! -f "$KEYFILE" ]]; then
  echo "SSH key not found: $KEYFILE" >&2
  exit 1
fi

SSH=(ssh -i "$KEYFILE" -o StrictHostKeyChecking=accept-new "${EC2_USER}@${EC2_HOST}")
RSYNC=(rsync -avz --delete
  -e "ssh -i $KEYFILE -o StrictHostKeyChecking=accept-new"
  --exclude .venv --exclude __pycache__ --exclude .env --exclude .env.*
  --exclude .data --exclude "*.pyc" --exclude .pytest_cache
)

echo "==> Sync ${ROOT} -> ${EC2_HOST}:${REMOTE_DIR}"
"${RSYNC[@]}" "$ROOT/" "${EC2_USER}@${EC2_HOST}:${REMOTE_DIR}/"

echo "==> ENABLE_COHORTS=true on server .env"
"${SSH[@]}" "bash -s" <<'REMOTE_ENV'
set -euo pipefail
ENV_FILE="/opt/nurture/community-service/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE" >&2
  exit 1
fi
if grep -q '^ENABLE_COHORTS=' "$ENV_FILE"; then
  sed -i 's/^ENABLE_COHORTS=.*/ENABLE_COHORTS=true/' "$ENV_FILE"
else
  echo 'ENABLE_COHORTS=true' >> "$ENV_FILE"
fi
grep '^ENABLE_COHORTS=' "$ENV_FILE"
REMOTE_ENV

echo "==> migrate + seed cohorts + restart daphne"
"${SSH[@]}" "bash -s" <<REMOTE_OPS
set -euo pipefail
cd ${REMOTE_DIR}
${REMOTE_VENV}/bin/python manage.py migrate --noinput
if [[ "${RUN_SEED_COHORTS}" == "1" ]]; then
  ${REMOTE_VENV}/bin/python manage.py seed_cohorts_demo
fi
sudo systemctl restart nurture-daphne
sleep 2
sudo systemctl is-active nurture-daphne
curl -sf http://127.0.0.1/health/ | head -c 200
echo ""
REMOTE_OPS

echo "==> Done. Verify: curl http://${EC2_HOST}/health/"
