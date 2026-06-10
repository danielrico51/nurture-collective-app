#!/usr/bin/env bash
# Provision SES Mail Manager resources for inbound mail (receiving).
# Does NOT grant outbound SES production access — that is a separate request.
set -euo pipefail

REGION="${AWS_REGION:-us-east-1}"
TRAFFIC_POLICY_NAME="${MAIL_MANAGER_TRAFFIC_POLICY_NAME:-nesting-place-inbound-policy}"
RULE_SET_NAME="${MAIL_MANAGER_RULE_SET_NAME:-nesting-place-inbound-rules}"
INGRESS_POINT_NAME="${MAIL_MANAGER_INGRESS_POINT_NAME:-nesting-place-inbound}"

echo "Region: $REGION"

EXISTING_TP="$(aws mailmanager list-traffic-policies --region "$REGION" \
  --query "TrafficPolicies[?TrafficPolicyName=='$TRAFFIC_POLICY_NAME'].TrafficPolicyId | [0]" \
  --output text 2>/dev/null || true)"

if [[ -n "$EXISTING_TP" && "$EXISTING_TP" != "None" ]]; then
  TRAFFIC_POLICY_ID="$EXISTING_TP"
  echo "Traffic policy exists: $TRAFFIC_POLICY_ID"
else
  TRAFFIC_POLICY_ID="$(aws mailmanager create-traffic-policy \
    --region "$REGION" \
    --traffic-policy-name "$TRAFFIC_POLICY_NAME" \
    --default-action ALLOW \
    --policy-statements '[{"Action":"ALLOW","Conditions":[{"TlsExpression":{"Evaluate":{"Attribute":"TLS_PROTOCOL"},"Operator":"MINIMUM_TLS_VERSION","Value":"TLS1_2"}}]}]' \
    --query TrafficPolicyId --output text)"
  echo "Created traffic policy: $TRAFFIC_POLICY_ID"
fi

EXISTING_RS="$(aws mailmanager list-rule-sets --region "$REGION" \
  --query "RuleSets[?RuleSetName=='$RULE_SET_NAME'].RuleSetId | [0]" \
  --output text 2>/dev/null || true)"

if [[ -n "$EXISTING_RS" && "$EXISTING_RS" != "None" ]]; then
  RULE_SET_ID="$EXISTING_RS"
  echo "Rule set exists: $RULE_SET_ID"
else
  RULE_SET_ID="$(aws mailmanager create-rule-set \
    --region "$REGION" \
    --rule-set-name "$RULE_SET_NAME" \
    --rules '[{"Name":"AcceptInbound","Actions":[{"AddHeader":{"HeaderName":"X-Nesting-Place-Processed","HeaderValue":"true"}}]}]' \
    --query RuleSetId --output text)"
  echo "Created rule set: $RULE_SET_ID"
fi

EXISTING_INP="$(aws mailmanager list-ingress-points --region "$REGION" \
  --query "IngressPoints[?IngressPointName=='$INGRESS_POINT_NAME'].IngressPointId | [0]" \
  --output text 2>/dev/null || true)"

if [[ -n "$EXISTING_INP" && "$EXISTING_INP" != "None" ]]; then
  INGRESS_POINT_ID="$EXISTING_INP"
  echo "Ingress point exists: $INGRESS_POINT_ID"
else
  INGRESS_POINT_ID="$(aws mailmanager create-ingress-point \
    --region "$REGION" \
    --ingress-point-name "$INGRESS_POINT_NAME" \
    --type OPEN \
    --traffic-policy-id "$TRAFFIC_POLICY_ID" \
    --rule-set-id "$RULE_SET_ID" \
    --query IngressPointId --output text)"
  echo "Created ingress point: $INGRESS_POINT_ID"
fi

aws mailmanager get-ingress-point --region "$REGION" --ingress-point-id "$INGRESS_POINT_ID" \
  --query '{Status:Status,ARecord:ARecord,TrafficPolicyId:TrafficPolicyId,RuleSetId:RuleSetId}' \
  --output table

cat <<EOF

Mail Manager inbound setup complete.

IMPORTANT:
- This is for RECEIVING email (inbound), not sending gift cards or transactional mail.
- Outbound SES production access is still required separately (see docs/platform/ses-production-access.md).
- Do NOT change nesting-place.com MX records unless you intend AWS to receive your mail.
  If info@ is on Google Workspace, keep Google MX; this ingress is optional until you route inbound mail here.
- Current rule set only tags messages (AddHeader). Add WriteToS3 or Relay later for delivery/archiving.

EOF
