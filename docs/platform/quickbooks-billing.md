# QuickBooks Billing & Payment Workflow

This document describes how website purchases, payments, and QuickBooks Online (QBO) invoices fit together in the Nurture Collective platform — including n8n automation hooks.

**Related code:**
- Config: `src/config/quickbooks.ts`, `src/config/billing.ts`
- Integration: `src/lib/integrations/quickbooks/`
- Billing service: `src/lib/billing/`
- API routes: `src/app/api/billing/`, `src/app/api/integrations/quickbooks/`, `src/app/api/webhooks/quickbooks/`

---

## Recommended architecture

Use a **hybrid payment + accounting** model:

| Layer | System | Responsibility |
|-------|--------|----------------|
| Checkout | Next.js + Stripe | Collect card/Apple Pay on the website |
| Order state | S3 (`billing/orders/...`) | Canonical purchase record |
| Accounting | QuickBooks Online | Customers, invoices, sales receipts, tax reporting |
| Orchestration | n8n | Invoice email, Slack alerts, retries, custom logic |

Stripe handles **payment capture**. QuickBooks handles **books, invoices, and tax**. n8n connects the two without hard-coding every workflow in the app.

---

## Payment workflows

### Flow A — E-commerce (gift cards, add-ons, one-time purchases)

Best for immediate purchases on the website.

```
Customer → POST /api/billing/checkout
         → S3 order (pending_payment)
         → n8n: billing.order.created
         → Stripe Checkout
         → Customer pays
         → Stripe webhook → mark order paid
         → n8n: billing.payment.succeeded
         → n8n creates QBO Customer + Sales Receipt (or paid Invoice)
         → QBO webhook → billing.quickbooks.webhook → update order
```

**Why Sales Receipt vs Invoice?** If payment is already collected via Stripe, create a **Sales Receipt** in QBO (money already received). Use an **Invoice** only when the customer will pay later.

### Flow B — Service contract (post-intake, post-sign)

Best for care packages after contract signing (matches `process-flow.md` Stage 10).

```
Contract signed → client record in nurture-clients
                → POST /api/billing/checkout (invoiceOnly: true)
                → S3 order (invoice_pending)
                → n8n: billing.invoice.requested
                → n8n creates QBO Invoice + sends payment link
                → Customer pays via QBO Payments or follow-up Stripe link
                → QBO Payment webhook → order status invoice_paid
                → Member portal shows paid status
```

### Flow C — Gift cards (existing)

Gift cards already use `POST /api/gift-cards/checkout` with `GIFT_CARD_ORDER_WEBHOOK_URL`. When enabling Stripe, point the same n8n workflow (or a dedicated branch) to create QBO entries after payment.

---

## Sync modes

Set `BILLING_SYNC_MODE` in environment:

| Mode | App behavior | When to use |
|------|--------------|-------------|
| `n8n` (default) | App emits events only; n8n calls QBO | **Recommended** — matches intake/gift-card pattern |
| `direct` | App calls QBO API directly | Small volume, no n8n |
| `hybrid` | App syncs to QBO, also emits n8n events | App-owned sync + n8n for notifications |

---

## n8n event catalog

All events POST to `N8N_BILLING_WEBHOOK_URL` with optional `Authorization: Bearer ${N8N_BILLING_WEBHOOK_SECRET}`.

| Event | Trigger | Suggested n8n actions |
|-------|---------|----------------------|
| `billing.order.created` | Checkout started | Log order, notify Slack ops |
| `billing.payment.succeeded` | Stripe payment confirmed | Create QBO customer, sales receipt, send receipt email |
| `billing.payment.failed` | Payment failed | Alert ops, send recovery email |
| `billing.invoice.requested` | `invoiceOnly` checkout | Create QBO invoice, email payment link |
| `billing.invoice.synced` | Direct/hybrid QBO sync | Update CRM, notify coordinator |
| `billing.quickbooks.webhook` | QBO entity changed | Sync invoice/payment status back to S3 order |
| `billing.refund.processed` | Refund issued | Create QBO credit memo |

Example payload:

```json
{
  "type": "billing.payment.succeeded",
  "receivedAt": "2026-05-31T12:00:00.000Z",
  "order": {
    "id": "uuid",
    "status": "paid",
    "customerEmail": "member@example.com",
    "amountCents": 25000,
    "lineItems": [{ "sku": "care-addon", "name": "Lactation consult", "quantity": 1, "unitAmountCents": 25000 }]
  },
  "payment": {
    "provider": "stripe",
    "reference": "pi_xxx",
    "amountCents": 25000
  }
}
```

---

## QuickBooks setup checklist

### 1. Intuit Developer app

**Production app URLs (required to unlock production keys):**

Replace `YOUR_DOMAIN` with your live `NEXT_PUBLIC_APP_URL` host (no path, no `https://`). Example Amplify **main** branch: `main.d9588bqvrp5xs.amplifyapp.com`. Example dev: `dev.d9588bqvrp5xs.amplifyapp.com`.

| Intuit field | Example value |
|--------------|----------------|
| Host domain | `main.d9588bqvrp5xs.amplifyapp.com` |
| Launch URL | `https://main.d9588bqvrp5xs.amplifyapp.com/admin/integrations/quickbooks` |
| Disconnect URL | `https://main.d9588bqvrp5xs.amplifyapp.com/admin/integrations/quickbooks?disconnected=1` |
| Connect/Reconnect URL | `https://main.d9588bqvrp5xs.amplifyapp.com/admin/integrations/quickbooks` |

**Redirect URI** (separate: **Keys & credentials → Redirect URIs → Production**):

`https://main.d9588bqvrp5xs.amplifyapp.com/api/integrations/quickbooks/oauth/callback`

All hosts must match the same deployment. If you later use a custom domain (e.g. `app.thenestingplacenj.com`), update every URL and Amplify `NEXT_PUBLIC_APP_URL` / `QBO_REDIRECT_URI` together.

**Legal URLs (required by Intuit):**

| Field | URL |
|-------|-----|
| Privacy policy | `https://<your-domain>/privacy-policy` |
| End-user license agreement | `https://<your-domain>/terms` |

Replace `<your-domain>` with your production `NEXT_PUBLIC_APP_URL` (no trailing slash). Pages are public at `src/app/(site)/privacy-policy/` and `src/app/(site)/terms/`.

1. Create an app at [developer.intuit.com](https://developer.intuit.com).
2. Add scopes: `com.intuit.quickbooks.accounting`, `openid`, `profile`, `email`.
3. Set redirect URI: `https://<your-domain>/api/integrations/quickbooks/oauth/callback`
4. Copy **Client ID** and **Client Secret**.

### 2. Connect OAuth (admin)

1. Sign in as a user in the **admin** Cognito group.
2. Open **`/admin/integrations/quickbooks`** and click **Connect QuickBooks**.
   - Do not paste `/api/integrations/quickbooks/oauth/authorize` in the browser bar — that API requires an `Authorization: Bearer` token and returns `Unauthorized` without it.
3. Authorize the company in Intuit; the callback stores tokens in S3 (`management/integrations/quickbooks/oauth.json`).
4. Return to the admin page and click **Refresh status**, or call `GET /api/integrations/quickbooks/status` with a Bearer token.

Alternatively, set `QBO_REFRESH_TOKEN` and `QBO_REALM_ID` manually in Amplify env vars.

**Amplify (configured via script):** App-level and `main` branch use production keys. After changing keys or environment, **reconnect** QuickBooks (old sandbox tokens are invalid). Run:

```bash
export QBO_CLIENT_ID='...' QBO_CLIENT_SECRET='...' QBO_ENVIRONMENT=production
QBO_APP_URL=https://dev.d9588bqvrp5xs.amplifyapp.com ./infrastructure/aws/scripts/set-amplify-qbo-env.sh
AMPLIFY_BRANCH=main QBO_APP_URL=https://main.d9588bqvrp5xs.amplifyapp.com ./infrastructure/aws/scripts/set-amplify-qbo-env.sh
```

Register **both** production redirect URIs in Intuit if you use dev and main: `.../dev.../oauth/callback` and `.../main.../oauth/callback`.

### 3. Webhooks

1. In Intuit Developer portal → Webhooks, set endpoint: `https://<your-domain>/api/webhooks/quickbooks`
2. Copy verifier token → `QBO_WEBHOOK_VERIFIER`
3. Subscribe to: `Invoice`, `Payment`, `Customer`

### 4. QuickBooks service items (income accounts)

QuickBooks routes revenue through **service items**, each linked to an income account. Create four items in QBO and set the corresponding env vars (item **Id** from QBO, not the account Id):

| Env var | Use for |
|---------|---------|
| `QBO_DEPOSIT_ITEM_ID` | Deposit invoices (`description: Deposit`) |
| `QBO_BIRTH_SERVICES_ITEM_ID` | Birth doula engagements and birth-related services |
| `QBO_POSTPARTUM_SUPPORT_ITEM_ID` | Postpartum engagements and doula care balances |
| `QBO_OTHER_OPERATION_INCOME_ITEM_ID` | Classes, massages, gift cards — QBO service item **Other Operating Income (Classes, Massages, etc.)** (must be a Service item linked to that income account) |
| `QBO_DEFAULT_ITEM_ID` | Fallback when a category item is not set |

CRM service invoices pick the item automatically from the linked engagement type, invoice description, and service title. Reissued engagement invoices follow the same rules.

**All payment methods (Venmo, Zelle, QuickBooks, etc.)** create a QuickBooks invoice when sent (`BILLING_SYNC_MODE=direct` or `hybrid`). Manual methods disable QBO online pay links — clients still receive Venmo/Zelle instructions from the CRM. When staff mark a manual invoice paid, the app records a QuickBooks payment against the open invoice. Stripe invoices still use a sales receipt on payment (no open QBO invoice on send).

### 5. Environment variables

```env
BILLING_SYNC_MODE=n8n
BILLING_PAYMENT_PROVIDER=stripe
N8N_BILLING_WEBHOOK_URL=https://n8n.example.com/webhook/billing
N8N_BILLING_WEBHOOK_SECRET=
QBO_ENVIRONMENT=sandbox
QBO_CLIENT_ID=
QBO_CLIENT_SECRET=
QBO_REALM_ID=
QBO_REDIRECT_URI=
QBO_WEBHOOK_VERIFIER=
QBO_DEFAULT_ITEM_ID=
BILLING_S3_BUCKET=nurture-clients-dev-ACCOUNT_ID
```

---

## API reference (scaffold)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/billing/checkout` | Public | Start purchase or request invoice |
| GET | `/api/billing/orders/[orderId]` | Member (owner) | Order status |
| GET | `/api/integrations/quickbooks/oauth/authorize` | Admin | Start OAuth |
| GET | `/api/integrations/quickbooks/oauth/callback` | Intuit redirect | Complete OAuth |
| GET | `/api/integrations/quickbooks/status` | Admin | Connection health |
| POST | `/api/webhooks/quickbooks` | Intuit signature | Inbound QBO events |

### Checkout example

```bash
curl -X POST https://localhost:3000/api/billing/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "customerEmail": "member@example.com",
    "customerName": "Jane Doe",
    "lineItems": [{
      "sku": "lactation-60",
      "name": "Lactation consult (60 min)",
      "quantity": 1,
      "unitAmountCents": 15000
    }],
    "successUrl": "https://example.com/apps/purchases/success",
    "cancelUrl": "https://example.com/apps/purchases"
  }'
```

For invoice-only (no immediate payment):

```json
{ "invoiceOnly": true, ... }
```

---

## S3 artifacts

```
s3://<BILLING_S3_BUCKET>/billing/orders/order_id=<uuid>/order.json
s3://<BILLING_S3_BUCKET>/management/integrations/quickbooks/oauth.json
```

Order JSON includes `quickbooks.customerId`, `quickbooks.invoiceId`, and sync status for portal display.

---

## Next steps

1. **Stripe webhook** — Add `POST /api/webhooks/stripe` to call `markPurchaseOrderPaid()` on `checkout.session.completed`.
2. **Member purchases UI** — Wire `src/app/(site)/apps/purchases/page.tsx` to `/api/billing/checkout`.
3. **n8n workflow** — Build the billing webhook workflow with QBO nodes (Create Customer → Create Invoice/Sales Receipt → Send Email).
4. **QBO sandbox testing** — Run end-to-end in sandbox before switching `QBO_ENVIRONMENT=production`.

---

## Decision guide: when to use what

| Scenario | Payment | QBO document |
|----------|---------|--------------|
| Gift card purchase | Stripe Checkout | Sales Receipt |
| Member add-on (paid upfront) | Stripe Checkout | Sales Receipt |
| Care package after contract | Invoice link (QBO or Stripe) | Invoice |
| Employer billing / NET-30 | Manual / ACH | Invoice |
| Refund | Stripe refund | Credit Memo (via n8n) |

This keeps the website fast for self-serve purchases while QBO remains the source of truth for accounting and tax.

---

## QuickBooks surcharging (CRM invoices)

When a client service invoice uses payment method **QuickBooks**, the CRM syncs **only the service subtotal** to QBO — no manual “Processing fee” line item. Card network rules do not allow both a convenience-fee line and Intuit surcharging on the same payment.

**Enable in QuickBooks:** Settings → Account and settings → Sales → Invoice payments → **Percentage based surcharging** (beta; not on all accounts).

**Verify:** Admin → Integrations → QuickBooks shows online payment flags from the Preferences API. Surcharge on/off is best confirmed by opening a test invoice pay link — Intuit does not fully expose surcharge settings via API.

**Do not** add a 3% processing fee in the CRM for QuickBooks invoices; QuickBooks adds the surcharge at checkout when the client chooses card or bank transfer.
