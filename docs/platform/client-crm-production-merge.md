# Client CRM + service invoices — production merge checklist

Use when merging `dev` → `main` so Client CRM, service invoices, and QuickBooks pay links work on **www.nesting-place.com** without leaking dev test data.

## Merge command

```bash
git checkout main
git pull origin main
git merge origin/dev
git push origin main
```

Amplify builds `main` with `APP_ENV=prod` automatically (`amplify.yml` uses `AWS_BRANCH=main`).

## Storage isolation (critical)

| Branch | S3 bucket | CRM prefix | Example client path |
|--------|-----------|------------|---------------------|
| **dev** | `nurture-clients-dev-{accountId}` | `crm/dev/` | `crm/dev/clients/client_id=…/profile/…/client.json` |
| **main** | `nurture-clients-prod-{accountId}` | `crm/` (legacy root) | `crm/clients/client_id=…/profile/…/client.json` |

Providers and service schedule (engagements, shifts, payouts) use the **same bucket and prefix** as Client CRM:

| Branch | Providers path | Schedule path |
|--------|----------------|---------------|
| **dev** | `crm/dev/providers/` | `crm/dev/clients/client_id=…/engagements/…` |
| **main** | `crm/providers/` | `crm/clients/client_id=…/engagements/…` |

**No new Amplify env vars** are required for providers or schedule — they reuse `NURTURE_CLIENTS_BUCKET` and `APP_ENV` / branch detection from `amplify.yml`.

Dev test clients **do not** appear on production when:

- `main` uses the **prod** bucket (`NURTURE_CLIENTS_BUCKET=nurture-clients-prod-*`)
- `main` has `APP_ENV=prod` (never `dev`)
- You never set `CLIENTS_CRM_S3_PREFIX=crm/dev/` on main

**Gap:** proposals (`clients/…`) and billing orders (`billing/orders/…`) are **not** under `crm/{env}/` — isolation relies on **separate buckets**. Never point the dev branch at the prod bucket.

Admin UI shows scope via `GET /api/admin/clients`, `GET /api/admin/providers`, and client engagement APIs → `storage.deploymentEnvironment` and `storage.scope`.

### Verify main branch env (Amplify Console or CLI)

Check that required keys **exist** on the `main` branch (values are secrets — verify in Console):

```bash
aws amplify get-branch --app-id d9588bqvrp5xs --branch-name main \
  --query 'branch.environmentVariables' --output json \
  | jq '[
      "APP_ENV",
      "NURTURE_CLIENTS_BUCKET",
      "BILLING_SYNC_MODE",
      "CLIENT_COMMS_EMAIL_FROM",
      "CLIENT_INVOICE_ACCESS_SECRET",
      "QBO_ENVIRONMENT",
      "QBO_CLIENT_ID",
      "QBO_CLIENT_SECRET",
      "QBO_DEFAULT_ITEM_ID",
      "RESEND_API_KEY",
      "NEXT_PUBLIC_APP_URL"
    ] | map({key: ., set: (. as $k | input | has($k))})' -
```

Expected on **main**: `APP_ENV=prod`, prod clients bucket, `BILLING_SYNC_MODE=direct`, QBO production credentials connected after deploy.

**Must be absent on main:** `CLIENTS_CRM_S3_PREFIX=crm/dev/`, dev bucket name, `APP_ENV=dev`.

## Amplify env — main branch

Run before or immediately after merge:

```bash
# Infra (once)
./infrastructure/aws/scripts/provision-platform.sh prod
./infrastructure/aws/scripts/attach-amplify-s3-policy.sh prod NurtureCollectiveAmplifyComputeRole

# Branch env
AMPLIFY_BRANCH=main ./infrastructure/aws/scripts/set-amplify-proposals-env.sh
AMPLIFY_BRANCH=main ./infrastructure/aws/scripts/set-amplify-client-comms-env.sh
AMPLIFY_BRANCH=main BILLING_SYNC_MODE=direct \
  ./infrastructure/aws/scripts/set-amplify-billing-sync-env.sh

export QBO_CLIENT_ID='...' QBO_CLIENT_SECRET='...' QBO_ENVIRONMENT=production
QBO_APP_URL=https://www.nesting-place.com \
  AMPLIFY_BRANCH=main ./infrastructure/aws/scripts/set-amplify-qbo-env.sh
QBO_DEFAULT_ITEM_ID=<prod-service-item-id> \
  ./infrastructure/aws/scripts/set-amplify-qbo-item-id.sh
```

### Required on main

| Variable | Purpose |
|----------|---------|
| `NURTURE_CLIENTS_BUCKET` | `nurture-clients-prod-{accountId}` |
| `APP_ENV` | `prod` (set by proposals script) |
| `BILLING_SYNC_MODE` | `direct` (required for CRM QuickBooks invoices) |
| `CLIENT_COMMS_EMAIL_FROM` | Invoice + communications sender |
| `CLIENT_INVOICE_ACCESS_SECRET` | Signed PDF download links (unique per branch) |
| `CLIENT_INVOICE_VENMO_HANDLE` / `CLIENT_INVOICE_ZELLE_EMAIL` | Manual payment instructions |
| `CLIENT_INVOICE_ACH_*` | Bank wire details in invoice emails (QuickBooks payment method) |
| `GIFT_CARD_EMAIL_*`, `RESEND_API_KEY` | Email delivery (app-level) |
| `QBO_CLIENT_ID`, `QBO_CLIENT_SECRET`, `QBO_ENVIRONMENT=production` | QuickBooks API |
| `QBO_REDIRECT_URI` | `https://www.nesting-place.com/api/integrations/quickbooks/oauth/callback` |
| `QBO_DEFAULT_ITEM_ID` | Service line item in prod QBO company |
| `NEXT_PUBLIC_APP_URL` | `https://www.nesting-place.com` |

**Do not set on main:** `APP_ENV=dev`, dev bucket name, or `CLIENTS_CRM_S3_PREFIX=crm/dev/`.

## External registrations (manual)

### Intuit Developer portal

Register production redirect URI:

`https://www.nesting-place.com/api/integrations/quickbooks/oauth/callback`

After deploy, connect QuickBooks at **Admin → Integrations → QuickBooks** on production. Enable **QuickBooks Payments** in the QBO company for customer pay links (`InvoiceLink`).

### Stripe webhook (if using Stripe invoice payment method)

- **URL:** `https://www.nesting-place.com/api/webhooks/stripe`
- **Event:** `checkout.session.completed`
- Handles `orderType: service_invoice` and gift card / class registration orders.
- Set `BILLING_PAYMENT_PROVIDER=stripe` on main if using Stripe for service invoices.

### QuickBooks webhooks (optional)

- **URL:** `https://www.nesting-place.com/api/webhooks/quickbooks`
- Set `QBO_WEBHOOK_VERIFIER` in Amplify from Intuit portal.

## Backward compatibility

Main had no Client CRM module before this merge. Existing prod proposals may use legacy `clients/client_id=<leadId>/` paths.

- Runtime: `resolveStorageClientId` and `resolveClientForProposal` map lead id → client UUID.
- Optional one-time migration (prod bucket only, `APP_ENV=prod`):

```bash
npm run migrate:clients -- --dry-run
npm run migrate:clients
```

Never run migration against the dev bucket unless intentionally migrating dev test data.

### Optional: seed provider registry (prod bucket only)

Import doula names from exported schedule HTML into `crm/providers/`:

```bash
APP_ENV=prod NURTURE_CLIENTS_BUCKET=nurture-clients-prod-{accountId} \
  npm run seed:providers -- --dry-run
# Then, if output looks correct:
SEED_PROVIDERS_ALLOW_PROD=true APP_ENV=prod NURTURE_CLIENTS_BUCKET=nurture-clients-prod-{accountId} \
  npm run seed:providers
```

## Cognito clients group

If not deployed:

```bash
npm run setup:cognito-clients-group
```

Adds confirmed app sign-ups to the `clients` Cognito group.

## Post-deploy verification

1. **Redeploy main** in Amplify Console after env var changes.
2. **Admin → Client CRM** — banner shows production scope / `crm/`; bucket is `nurture-clients-prod-*`.
3. **Admin → Providers** — banner shows production scope; list loads; payout report section works.
4. **Admin → Clients → Schedule** — book engagement, edit details, add shifts and payout batch.
5. **Admin → Leads** — expand lead → edit contact info → save; list header updates.
6. **Admin → Clients → Services** — payment methods: Venmo, Zelle, Debit/Credit/ACH/Bank Wire (QuickBooks), Stripe (no standalone ACH option).
7. **Dev branch** — same admin pages show `crm/dev/` scope; dev test data must not appear on main.
8. Create or convert a client on **main**; add a service; send Venmo/Zelle invoice → email + PDF link.
9. Connect QuickBooks on main → send QuickBooks invoice → pay link in email (requires QBO Payments).
10. **Proposals tab** — shows **Experimental** badge; preview-only, not client-facing.
11. Regression: leads, classes, gift cards still work (see [events-classes-production-merge.md](./events-classes-production-merge.md)).

## Rollback

- Archive test clients in admin rather than deleting S3 data.
- Unpublish or avoid sending invoices until config is corrected.
- CRM data remains under `crm/` in the prod bucket.
