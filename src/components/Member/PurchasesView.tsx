"use client";

import { runWithAutoRetry } from "@/lib/api/fetchWithRetry";
import { fetchMemberPurchases } from "@/lib/api/purchasesClient";
import { MemberAppIcon } from "@/components/Member/MemberAppIcon";
import { getMemberAppById } from "@/config/memberApps";
import { PAYMENT_METHODS } from "@/config/paymentMethods";
import { useRequireMember } from "@/hooks/useRequireMember";
import type {
  MemberPaymentStatus,
  MemberPurchase,
  MemberPurchaseKind,
  MemberPurchaseQuickBooks,
} from "@/types/memberPurchases";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100
  );

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));

const paymentStatusLabel: Record<MemberPaymentStatus, string> = {
  pending_payment: "Payment pending",
  paid: "Paid",
  invoice_pending: "Invoice pending",
  invoice_sent: "Invoice sent",
  cancelled: "Cancelled",
  refunded: "Refunded",
  other: "Unknown",
};

const paymentStatusClass = (status: MemberPaymentStatus): string => {
  if (status === "paid") return "bg-emerald-100 text-emerald-900";
  if (status === "pending_payment" || status === "invoice_pending") {
    return "bg-amber-100 text-amber-950";
  }
  if (status === "cancelled" || status === "refunded") return "bg-nurture-charcoal/10 text-nurture-charcoal/70";
  return "bg-nurture-sage/15 text-nurture-sage-dark";
};

const quickBooksLabel = (qb: MemberPurchaseQuickBooks): string => {
  if (qb.syncStatus === "synced") {
    const doc = qb.documentNumber || qb.documentId;
    const type = qb.documentType === "sales_receipt" ? "Sales receipt" : "Invoice";
    return doc ? `${type} #${doc}` : `${type} synced`;
  }
  if (qb.syncStatus === "failed") return "QuickBooks sync failed";
  if (qb.syncStatus === "pending") return "QuickBooks pending";
  return "—";
};

const quickBooksClass = (qb: MemberPurchaseQuickBooks): string => {
  if (qb.syncStatus === "synced") return "bg-nurture-sage/15 text-nurture-sage-dark";
  if (qb.syncStatus === "failed") return "bg-red-100 text-red-900";
  return "bg-nurture-cream text-nurture-charcoal/65";
};

const formatShortDate = (iso: string | null | undefined) => {
  if (!iso) return null;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(iso)
  );
};

const purchaseKindLabel: Record<MemberPurchaseKind, string> = {
  gift_card: "eGift card",
  service: "Service order",
  client_invoice: "Service invoice",
};

const paymentMethodLabel = (method?: string): string | null => {
  if (!method) return null;
  return PAYMENT_METHODS.find((entry) => entry.id === method)?.label ?? method;
};

function PurchaseRow({ purchase }: { purchase: MemberPurchase }) {
  const methodLabel = paymentMethodLabel(purchase.paymentProvider);
  const dueDate = formatShortDate(purchase.dueDate ?? undefined);

  return (
    <tr className="border-b border-nurture-sage/10 last:border-0">
      <td className="px-4 py-4 align-top">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-nurture-charcoal/45">
          {purchaseKindLabel[purchase.kind]}
        </p>
        <p className="font-medium text-nurture-charcoal">{purchase.title}</p>
        {purchase.invoiceNumber ? (
          <p className="mt-1 text-xs text-nurture-charcoal/60">
            Invoice {purchase.invoiceNumber}
          </p>
        ) : null}
        {purchase.installmentLabel ? (
          <p className="mt-1 text-xs text-nurture-charcoal/60">
            {purchase.installmentLabel}
          </p>
        ) : null}
        {purchase.recipientLabel ? (
          <p className="mt-1 text-xs text-nurture-charcoal/60">
            Recipient: {purchase.recipientLabel}
          </p>
        ) : null}
        {purchase.description &&
        purchase.description !== purchase.installmentLabel ? (
          <p className="mt-1 line-clamp-2 text-xs text-nurture-charcoal/55">
            {purchase.description}
          </p>
        ) : null}
        {dueDate && purchase.paymentStatus !== "paid" ? (
          <p className="mt-1 text-xs text-nurture-charcoal/55">Due {dueDate}</p>
        ) : null}
        <p className="mt-2 text-xs text-nurture-charcoal/45">
          {formatDate(purchase.paidAt ?? purchase.createdAt)}
        </p>
      </td>
      <td className="px-4 py-4 align-top text-sm font-semibold text-nurture-charcoal">
        {formatCurrency(purchase.amountCents)}
        {purchase.processingFeeCents && purchase.processingFeeCents > 0 ? (
          <p className="mt-1 text-[11px] font-normal text-nurture-charcoal/55">
            incl. {formatCurrency(purchase.processingFeeCents)} fee
          </p>
        ) : null}
      </td>
      <td className="px-4 py-4 align-top">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${paymentStatusClass(purchase.paymentStatus)}`}
        >
          {paymentStatusLabel[purchase.paymentStatus]}
        </span>
        {methodLabel ? (
          <p className="mt-1 text-[10px] uppercase tracking-wide text-nurture-charcoal/45">
            via {methodLabel}
          </p>
        ) : purchase.paymentProvider ? (
          <p className="mt-1 text-[10px] uppercase tracking-wide text-nurture-charcoal/45">
            via {purchase.paymentProvider}
          </p>
        ) : null}
      </td>
      <td className="px-4 py-4 align-top">
        <span
          className={`inline-flex max-w-[12rem] rounded-full px-2.5 py-1 text-xs font-semibold ${quickBooksClass(purchase.quickbooks)}`}
          title={purchase.quickbooks.lastError ?? undefined}
        >
          {quickBooksLabel(purchase.quickbooks)}
        </span>
      </td>
      <td className="px-4 py-4 align-top">
        {purchase.printUrl ? (
          <a
            href={purchase.printUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-full border border-nurture-sage/30 px-3 py-1.5 text-xs font-semibold text-nurture-sage-dark hover:bg-nurture-sage/10"
          >
            View / print
          </a>
        ) : (
          <span className="text-xs text-nurture-charcoal/40">—</span>
        )}
      </td>
    </tr>
  );
}

export function PurchasesView() {
  const { ready, loading: authLoading, user } = useRequireMember();
  const app = getMemberAppById("purchases");
  const [purchases, setPurchases] = useState<MemberPurchase[]>([]);
  const [clientLinked, setClientLinked] = useState(false);
  const [accountEmail, setAccountEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await runWithAutoRetry(() => fetchMemberPurchases());
      setPurchases(data.purchases);
      setClientLinked(data.clientLinked);
      setAccountEmail(data.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load purchases");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    void load();
  }, [ready, load]);

  if (authLoading || !ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-nurture-charcoal/60">Loading purchases…</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="rounded-2xl border border-nurture-sage/15 bg-gradient-to-br from-nurture-cream/80 to-white px-6 py-8 sm:px-8">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-nurture-sage/15 text-nurture-sage-dark">
            <MemberAppIcon icon="purchases" className="h-7 w-7" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-nurture-sage-dark">
              Member app
            </p>
            <h2 className="mt-1 font-serif text-2xl font-semibold text-nurture-charcoal sm:text-3xl">
              {app?.title ?? "Purchases"}
            </h2>
            <p className="mt-2 text-sm text-nurture-charcoal/75">
              Orders and invoices linked to{" "}
              <span className="font-medium">{accountEmail || user?.loginId}</span>
              . eGift cards and service orders show Stripe payment status; care
              service invoices include printable copies for your records.
            </p>
          </div>
        </div>
      </div>

      <p className="mt-4 rounded-xl border border-nurture-sage/15 bg-nurture-sage/5 px-4 py-3 text-xs text-nurture-charcoal/70">
        Gift cards bought with a <strong>different email</strong> than your sign-in address will not
        appear here. Use the same email at checkout or{" "}
        <Link href="/contact" className="font-medium text-nurture-sage-dark hover:underline">
          contact us
        </Link>{" "}
        for help.
      </p>

      {clientLinked ? (
        <p className="mt-3 rounded-xl border border-violet-200 bg-violet-50/70 px-4 py-3 text-xs text-violet-950">
          Your account is linked to our client records. Service invoices and payment
          history for doula and care packages appear below — open{" "}
          <strong>View / print</strong> to save a PDF for insurance or your files.
        </p>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
          <button
            type="button"
            onClick={() => void load()}
            className="ml-3 font-semibold underline"
          >
            Retry
          </button>
        </div>
      ) : null}

      {loading ? (
        <p className="mt-10 text-sm text-nurture-charcoal/60">Loading your orders…</p>
      ) : purchases.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-nurture-sage/25 bg-white/80 px-6 py-12 text-center">
          <p className="font-medium text-nurture-charcoal">No purchases yet</p>
          <p className="mt-2 text-sm text-nurture-charcoal/65">
            {clientLinked
              ? "Your client account is linked. Service invoices will appear here once they are sent."
              : "eGift cards, service orders, and care invoices appear here after payment."}
          </p>
          <Link
            href="/gift-cards"
            className="mt-6 inline-flex rounded-full bg-nurture-sage px-5 py-2.5 text-sm font-semibold text-white hover:bg-nurture-sage-dark"
          >
            Buy an eGift card
          </Link>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-nurture-sage/15 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-nurture-sage/15 bg-nurture-cream/50 text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/55">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">QuickBooks</th>
                  <th className="px-4 py-3">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((purchase) => (
                  <PurchaseRow key={`${purchase.kind}-${purchase.id}`} purchase={purchase} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
