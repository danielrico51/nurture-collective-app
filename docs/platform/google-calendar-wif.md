# Calendar auth — Workload Identity Federation (production)

Durable `/book` scheduling auth without expiring `authorized_user` ADC tokens.

## Problem

Delegated calendar access previously stored a human `gcloud` refresh token in Amplify (`GOOGLE_CALENDAR_ADC_JSON`). Those tokens expire (`invalid_rapt`) and break `/book` until someone re-authenticates and redeploys.

## Solution

**AWS → Google Workload Identity Federation (WIF):**

```
Amplify SSR (AWS IAM role)
  → Google STS (workload identity pool)
  → impersonate nurture-tasks-sync service account
  → IAM signJwt → domain-wide delegation as admin@
  → Calendar API
```

No user refresh token in Amplify. AWS credentials rotate automatically.

## One-time setup

```bash
npm run setup:google-wif
# Creates GCP pool/provider, binds service account, pushes env to Amplify main
```

Optional redeploy:

```bash
REDEPLOY=true REMOVE_ADC_JSON=true npm run setup:google-wif
```

## Verify

From a shell with **Amplify compute role** or **nurture-collective-amplify-server** IAM credentials:

```bash
GOOGLE_CALENDAR_AUTH_MODE=wif \
GOOGLE_WORKLOAD_IDENTITY_PROJECT_NUMBER=643818957131 \
GOOGLE_WORKLOAD_IDENTITY_POOL_ID=nurture-amplify-aws \
GOOGLE_WORKLOAD_IDENTITY_PROVIDER_ID=aws-amplify \
npm run verify:calendar-deploy
```

Local dev keeps `GOOGLE_CALENDAR_AUTH_MODE=delegated` + gcloud ADC in `.env.local` (do not set WIF vars locally unless testing WIF).

## Amplify env (production)

| Variable | Example |
|----------|---------|
| `GOOGLE_CALENDAR_AUTH_MODE` | `wif` |
| `GOOGLE_WORKLOAD_IDENTITY_PROJECT_NUMBER` | `643818957131` |
| `GOOGLE_WORKLOAD_IDENTITY_POOL_ID` | `nurture-amplify-aws` |
| `GOOGLE_WORKLOAD_IDENTITY_PROVIDER_ID` | `aws-amplify` |
| `GOOGLE_WORKLOAD_IDENTITY_SERVICE_ACCOUNT` | `nurture-tasks-sync@...` |

After WIF is verified, remove `GOOGLE_CALENDAR_ADC_JSON` and `GOOGLE_TASKS_ADC_JSON` from Amplify.

## Prerequisites (unchanged)

- Domain-wide delegation for `nurture-tasks-sync` in Google Workspace Admin
- Calendar owned/managed by `admin@nesting-place.com`
- Amplify compute role: `NurtureCollectiveAmplifyComputeRole` (or server IAM user)
