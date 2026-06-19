#!/usr/bin/env bash
# One-time CDK bootstrap for regions used by Amplify Gen 2 / branch deploys.
#
# Run as an account admin (not the limited Amplify console IAM user).
#
# Usage:
#   ./infrastructure/aws/scripts/bootstrap-cdk-regions.sh
#   CDK_REGIONS="us-east-1 us-east-2" ./infrastructure/aws/scripts/bootstrap-cdk-regions.sh
#
set -euo pipefail

ACCOUNT_ID="${AWS_ACCOUNT_ID:-$(aws sts get-caller-identity --query Account --output text)}"
REGIONS="${CDK_REGIONS:-us-east-1 us-east-2}"

log() { printf '→ %s\n' "$*"; }

main() {
  for region in $REGIONS; do
    log "Bootstrapping CDK in ${region} (account ${ACCOUNT_ID})"
    npx --yes aws-cdk@2 bootstrap "aws://${ACCOUNT_ID}/${region}"
  done
  log "Done. Team Amplify console users can deploy without creating CDKToolkit themselves."
}

main "$@"
