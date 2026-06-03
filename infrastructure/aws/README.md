# Nurture Collective — AWS Platform Infrastructure

Provisions S3-native operational storage and IAM policies for the AI intake → client conversion pipeline.

## Prerequisites

- AWS CLI configured (`aws sts get-caller-identity`)
- Permissions: `cloudformation:*`, `s3:*`, `iam:*` (or scoped admin)

## Quick start (dev)

```bash
chmod +x infrastructure/aws/scripts/provision-platform.sh
./infrastructure/aws/scripts/provision-platform.sh dev
```

This creates:

| Resource | Name pattern |
|----------|--------------|
| Leads | `nurture-leads-dev-{accountId}` |
| Clients | `nurture-clients-dev-{accountId}` |
| Events | `nurture-events-dev-{accountId}` |
| Contracts | `nurture-contracts-dev-{accountId}` |
| Proposals | `nurture-proposals-dev-{accountId}` |
| Notifications | `nurture-notifications-dev-{accountId}` |
| Analytics | `nurture-analytics-dev-{accountId}` |
| Access logs | `nurture-platform-access-logs-dev-{accountId}` |

## Attach policies to existing roles

### Amplify SSR (Next.js — CRM, intake, tasks)

The CRM app reads leads from `NURTURE_LEADS_BUCKET`. Access denied means the **Amplify compute role** (or `SERVER_AWS_*` IAM user, if set) is missing S3 permissions — not an app bug.

**Option A — attach after stack deploy (recommended)**

```bash
chmod +x infrastructure/aws/scripts/attach-amplify-s3-policy.sh
./infrastructure/aws/scripts/attach-amplify-s3-policy.sh dev NurtureCollectiveAmplifyComputeRole
```

Replace the role name with your app’s compute role from **Amplify Console → Hosting → Compute role**.

**Option B — attach automatically on stack update**

```bash
./infrastructure/aws/scripts/provision-platform.sh dev NurtureCollectiveAmplifyComputeRole
```

**Option C — manual**

After deploy, note `AmplifyPlatformPolicyArn` from stack outputs.

```bash
aws iam attach-role-policy \
  --role-name NurtureCollectiveAmplifyComputeRole \
  --policy-arn <AmplifyPlatformPolicyArn>
```

Or merge statements from `policies/amplify-compute-s3.json` (replace `ENV` and `ACCOUNT_ID`).

### If `SERVER_AWS_ACCESS_KEY_ID` is set in Amplify

Amplify uses those static keys **instead of** the compute role (`amplifyCredentials.ts` prefers `SERVER_AWS_*` over the role).

The IAM user behind those keys (default: `nurture-collective-amplify-server`) must have the same S3 access as the compute role. Attach the platform policy to that user:

```bash
chmod +x infrastructure/aws/scripts/attach-amplify-server-user-policy.sh
./infrastructure/aws/scripts/attach-amplify-server-user-policy.sh dev
```

**Alternative:** remove `SERVER_AWS_ACCESS_KEY_ID` and `SERVER_AWS_SECRET_ACCESS_KEY` from Amplify env vars so SSR uses `NurtureCollectiveAmplifyComputeRole` only (must have `NurtureAmplifyPlatformS3-dev` attached).

### Amplify env vars (dev branch)

After IAM is fixed, confirm in **Amplify → Environment variables** and redeploy:

```env
NURTURE_LEADS_BUCKET=nurture-leads-dev-<your-account-id>
TASKS_S3_BUCKET=nurture-collective-tasks
INTAKE_S3_BUCKET=nurture-collective-tasks
AWS_REGION=us-east-1
QBO_ENVIRONMENT=sandbox
QBO_CLIENT_ID=<from Intuit Developer>
QBO_CLIENT_SECRET=<from Intuit Developer>
QBO_REDIRECT_URI=https://dev.d9588bqvrp5xs.amplifyapp.com/api/integrations/quickbooks/oauth/callback
BILLING_SYNC_MODE=n8n
```

QuickBooks credentials (merge into existing Amplify app env without wiping other keys):

```bash
export QBO_CLIENT_ID='...'
export QBO_CLIENT_SECRET='...'
chmod +x infrastructure/aws/scripts/set-amplify-qbo-env.sh
./infrastructure/aws/scripts/set-amplify-qbo-env.sh
```

Redeploy the **dev** branch after updating env vars.

### Stripe gift card payments

```bash
export STRIPE_SECRET_KEY='sk_live_...'   # or rk_live_... with Checkout Sessions write
export STRIPE_WEBHOOK_SECRET='whsec_...' # after webhook is created in Stripe Dashboard
chmod +x infrastructure/aws/scripts/set-amplify-stripe-env.sh
./infrastructure/aws/scripts/set-amplify-stripe-env.sh
```

Webhook endpoint: `https://dev.d9588bqvrp5xs.amplifyapp.com/api/webhooks/stripe` · event `checkout.session.completed`

Bucket name must match the CloudFormation `LeadsBucketName` output exactly.

Admin **coverage map** reads/writes `s3://nurture-collective-tasks/platform/coverage/coverage-config.json`. The compute policy must allow `s3:GetObject` and `s3:PutObject` on that path (see `policies/nurture-collective-amplify-compute-live.json`).

### Django backend API

Use `BackendApiRoleArn` for ECS task role, EC2 instance profile, or Elastic Beanstalk.

## Environment variables

Add to `.env.local`, Amplify, and Django settings:

```env
AWS_REGION=us-east-1
NURTURE_LEADS_BUCKET=nurture-leads-dev-886436941204
NURTURE_CLIENTS_BUCKET=nurture-clients-dev-886436941204
NURTURE_EVENTS_BUCKET=nurture-events-dev-886436941204
NURTURE_CONTRACTS_BUCKET=nurture-contracts-dev-886436941204
NURTURE_PROPOSALS_BUCKET=nurture-proposals-dev-886436941204
NURTURE_NOTIFICATIONS_BUCKET=nurture-notifications-dev-886436941204
NURTURE_ANALYTICS_BUCKET=nurture-analytics-dev-886436941204
```

Replace account suffix with your stack outputs.

## Legacy bucket

`nurture-collective-tasks` remains for admin task board and current intake partitions during migration. Amplify policy includes read/write on that bucket.

## Production

```bash
./infrastructure/aws/scripts/provision-platform.sh prod
```

Use separate stacks per environment. Never share buckets across prod/dev.

## Athena / Glue (Sprint 4)

Point Glue crawlers at:

- `s3://nurture-events-{env}-{account}/year=*/month=*/day=*/`
- `s3://nurture-analytics-{env}-{account}/`

See [docs/platform/architecture.md](../../docs/platform/architecture.md).
