# Gift card payments (Stripe + QuickBooks)

## Flow

```
Customer → POST /api/gift-cards/checkout
         → Order saved to S3 (gift-cards/orders/...)
         → Stripe Checkout
         → Customer pays
         → Stripe webhook (or /api/gift-cards/confirm on return)
         → Order status: paid
         → QuickBooks Sales Receipt (if OAuth connected)
         → Optional n8n event: gift_card.payment.succeeded
```

Stripe collects payment. QuickBooks records the sale as a **Sales Receipt** (payment already received).

## Stripe API key permissions

Gift card checkout uses **Stripe Checkout Sessions**. Restricted keys (`rk_live_...`) must include:

- **Checkout Sessions — Write** (`rak_checkout_session_write`)
- **Checkout Sessions — Read** (recommended, for `/api/gift-cards/confirm`)

Or use the standard **Secret key** (`sk_live_...`) from Stripe Dashboard → API keys.

## Required Amplify env vars

```env
GIFT_CARD_PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_GIFT_CARD_PAYMENTS_ENABLED=true
NEXT_PUBLIC_GIFT_CARD_PAYMENT_PROVIDER=stripe
QBO_DEFAULT_ITEM_ID=<QuickBooks service item id>
```

QuickBooks OAuth must be connected at `/admin/integrations/quickbooks`.

## Stripe Dashboard setup

1. Developers → Webhooks → Add endpoint  
   `https://dev.d9588bqvrp5xs.amplifyapp.com/api/webhooks/stripe`
2. Events: `checkout.session.completed`
3. Copy signing secret → `STRIPE_WEBHOOK_SECRET`

## Order storage

`s3://<BILLING_S3_BUCKET>/gift-cards/orders/order_id=<uuid>/order.json`

Includes `quickbooks.salesReceiptId` after successful sync.

## Email (interim — personal address via SES)

Use your **personal email** as the sender until Nesting Place domain mail is ready.

### One-time setup

1. **Verify the address in SES** (same AWS account/region as Amplify, usually `us-east-1`):

   ```bash
   aws ses verify-email-identity --email-address "you@gmail.com" --region us-east-1
   ```

   Click the verification link AWS emails you.

2. **Amplify env** (after verification):

   ```bash
   export GIFT_CARD_EMAIL_FROM='you@gmail.com'
   export GIFT_CARD_FULFILLMENT_EMAIL='you@gmail.com'
   chmod +x infrastructure/aws/scripts/set-amplify-gift-card-email-env.sh
   ./infrastructure/aws/scripts/set-amplify-gift-card-email-env.sh
   ```

3. Redeploy **dev**.

### What gets sent

| Recipient | When |
|-----------|------|
| Gift recipient | Immediately after payment (unless delivery is **scheduled** — then only you get the alert) |
| Purchaser | Copy if they checked “send copy to me” |
| `GIFT_CARD_FULFILLMENT_EMAIL` | Order summary (your inbox) |

Emails show as **“The Nesting Place &lt;you@gmail.com&gt;”** with optional `GIFT_CARD_EMAIL_REPLY_TO` (e.g. `hello@nurturecollective.com`).

Also: **Stripe receipt** (Dashboard → Customer emails → Successful payments) and **n8n** `N8N_INQUIRY_WEBHOOK_URL` as backup.

Long term: verify `thenestingplace.com` (or similar) in SES and swap `GIFT_CARD_EMAIL_FROM`.
