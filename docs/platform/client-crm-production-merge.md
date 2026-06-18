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

Dev test clients **do not** appear on production when:

- `main` uses the **prod** bucket (`NURTURE_CLIENTS_BUCKET=nurture-clients-prod-*`)
- `main` has `APP_ENV=prod` (never `dev`)
- You never set `CLIENTS_CRM_S3_PREFIX=crm/dev/` on main

**Gap:** proposals (`clients/…`) and billing orders (`billing/orders/…`) are **not** under `crm/{env}/` — isolation relies on **separate buckets**. Never point the dev branch at the prod bucket.

Admin UI shows scope via `GET /api/admin/clients` → `storage.deploymentEnvironment` and `storage.scope`.

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

## Cognito clients group

If not deployed:

```bash
npm run setup:cognito-clients-group
```

Adds confirmed app sign-ups to the `clients` Cognito group.

## Post-deploy verification

1. **Redeploy main** in Amplify Console after env var changes.
2. **Admin → Client CRM** — banner shows production scope / `crm/`; bucket is `nurture-clients-prod-*`.
3. **Dev branch** — same admin page shows `crm/dev/` scope; dev test clients must not appear on main.
4. Create or convert a client on **main**; add a service; send Venmo/Zelle invoice → email + PDF link.
5. Connect QuickBooks on main → send QuickBooks invoice → pay link in email (requires QBO Payments).
6. **Proposals tab** — shows **Experimental** badge; preview-only, not client-facing.
7. Regression: leads, classes, gift cards still work (see [events-classes-production-merge.md](./events-classes-production-merge.md)).

## Rollback

- Archive test clients in admin rather than deleting S3 data.
- Unpublish or avoid sending invoices until config is corrected.
- CRM data remains under `crm/` in the prod bucket.
