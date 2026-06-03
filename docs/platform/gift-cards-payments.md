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
