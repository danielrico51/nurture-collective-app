# Service invoices — refunds (manual label)

Service invoices in Client CRM support a **`refunded`** status for tracking when money has been returned to a client. This is **label-only** today: the app does not initiate Stripe refunds, QuickBooks credit memos, or Venmo/Zelle transfers.

## Current behavior

### Admin (Client CRM → Services → Invoices)

- **Mark refunded** appears on **paid** invoices only.
- Confirmation explains that this is a tracking label and the actual refund must be processed outside the app.
- The invoice badge shows **Refunded** (rose) in admin, member Purchases, and payment history on printable invoices.
- **Service balance** is restored: refunded invoices no longer count toward “paid to date,” so the remaining balance on the service increases by that invoice’s **subtotal** (excluding processing fee).

### Member (Purchases app)

- Linked clients see refunded service invoices with a **Refunded** payment status.
- **View / print** still works for records/insurance if needed.

### What the app does *not* do

| Payment method | Gap |
|----------------|-----|
| **Stripe** | No `refunds.create`; webhook does not listen for `charge.refunded` |
| **QuickBooks** | No credit memo or void sync |
| **Venmo / Zelle / ACH** | No payout tracking — admin handles manually |

There is no `refundedAt`, refund reference, or client notification email yet.

## Manual workflow (recommended)

1. Process the refund in the real channel (Venmo, Stripe dashboard, QBO, check, etc.).
2. In Client CRM, open the client → **Services** → find the **paid** invoice → **Mark refunded**.
3. Confirm the service **balance due** looks correct if you plan to re-invoice or close the service.
4. Optionally note the refund in the client’s CRM notes or invoice notes (notes are not auto-emailed on label change).

## Balance math

- **Paid** invoices reduce the service balance by `subtotalCents` (service portion, not processing fee).
- **Refunded** invoices are excluded from paid totals; balance = `service total − sum(paid subtotals)`.
- Do not mark an invoice refunded unless it was previously **paid** — unpaid/sent invoices should be **cancelled** or edited instead.

## Future improvements (design reserve)

When automated refunds are needed, extend in this order:

1. **Data model** — optional fields on `ServiceInvoice`:
   - `refundedAt`, `refundReference`, `refundProvider`, `refundNotes`, `refundedBy`
2. **API** — keep `markRefunded` for manual path; add `processStripeRefund` when `paymentMethod === "stripe"` and `stripe.paymentIntentId` exists.
3. **Stripe** — admin “Refund via Stripe” → API refund → webhook `charge.refunded` confirms → set status + metadata.
4. **QuickBooks** — credit memo linked to original QBO invoice id (`quickbooks.invoiceId`).
5. **Comms** — optional “refund confirmation” email using branded invoice templates.
6. **n8n** — emit `billing.refund.processed` (type already reserved in `src/lib/billing/n8nEvents.ts`) for accounting automations.

Until then, **`markRefunded` + status label** is the supported path.

## Related code

| Area | Location |
|------|----------|
| Status type | `src/types/clientService.ts` — `ServiceInvoiceStatus` |
| Mark refunded | `updateServiceInvoice` — `markRefunded` in `src/lib/client-services/storage.ts` |
| Balance | `src/lib/client-services/balances.ts` |
| Admin UI | `src/components/Admin/ClientServicesTab.tsx` |
| Member list | `src/lib/purchases/memberClientInvoices.ts` |
| Labels on PDF/email | `src/lib/invoices/serviceContext.ts` |

## QuickBooks on payment (Stripe / QuickBooks)

When a service invoice is **paid** via **Stripe** or **QuickBooks**, the app attaches the QuickBooks accounting document to the CRM invoice — same pattern as eGift cards:

| Payment method | QuickBooks document | When |
|----------------|---------------------|------|
| **Stripe** | **Sales Receipt** | After Stripe checkout succeeds (webhook) or admin **Mark paid** |
| **QuickBooks** | **QBO Invoice** (pay link at send) | Invoice created at send; marked synced when paid |

Stripe-paid invoices get a QBO Sales Receipt with line items matching the CRM invoice (service amount + processing fee). See `syncServiceInvoicePaymentToQuickBooks` in `src/lib/invoices/quickbooksSync.ts`.

Requires `BILLING_SYNC_MODE=direct` (or `hybrid`) and connected QuickBooks — same as sending QuickBooks pay-link invoices.
