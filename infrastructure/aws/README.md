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

### Amplify SSR (Next.js intake)

After deploy, note `AmplifyPlatformPolicyArn` from stack outputs.

```bash
aws iam attach-role-policy \
  --role-name NurtureCollectiveAmplifyComputeRole \
  --policy-arn <AmplifyPlatformPolicyArn>
```

Or merge statements from `policies/amplify-compute-s3.json` into the existing compute role policy.

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
