"use client";

import { integrations } from "@/config/integrations";
import Link from "next/link";

export type GiftCardConfirmSummary = {
  amountDollars: number;
  recipientName: string;
  recipientEmail: string;
  sendCopyToPurchaser: boolean;
};

type GiftCardSuccessBannerProps = {
  summary: GiftCardConfirmSummary | null;
  loading: boolean;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

export function GiftCardSuccessBanner({ summary, loading }: GiftCardSuccessBannerProps) {
  if (loading) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 pb-6 sm:px-6 lg:px-8">
        <p className="rounded-2xl border border-nurture-sage/20 bg-nurture-sage/5 px-5 py-4 text-sm text-nurture-charcoal/75">
          Confirming your payment…
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-xl px-4 pb-6 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-nurture-sage/25 bg-nurture-sage/10 px-6 py-5">
        <p className="font-serif text-xl font-semibold text-nurture-charcoal">
          Payment received — thank you!
        </p>
        {summary ? (
          <p className="mt-2 text-sm text-nurture-charcoal/80">
            Your {formatCurrency(summary.amountDollars)} eGift card for{" "}
            <span className="font-medium">{summary.recipientName}</span> (
            {summary.recipientEmail}) is being prepared. We email the recipient shortly
            after payment.
          </p>
        ) : (
          <p className="mt-2 text-sm text-nurture-charcoal/80">
            Your eGift card order is being processed.
          </p>
        )}
        <ul className="mt-4 list-inside list-disc space-y-1.5 text-sm text-nurture-charcoal/75">
          <li>
            <span className="font-medium">Payment receipt:</span> Stripe may email a receipt to
            the address you used at checkout (enable under Stripe Dashboard → Settings → Customer
            emails).
          </li>
          <li>
            <span className="font-medium">eGift card delivery:</span> We email the recipient
            {" "}shortly after payment
            .{summary?.sendCopyToPurchaser ? " A copy goes to you if you requested one." : null}
          </li>
        </ul>
        <p className="mt-4 text-sm text-nurture-charcoal/70">
          Questions?{" "}
          <Link href="/contact" className="font-medium text-nurture-sage-dark hover:underline">
            Contact us
          </Link>{" "}
          or email{" "}
          <a
            href={`mailto:${integrations.contactEmail}`}
            className="font-medium text-nurture-sage-dark hover:underline"
          >
            {integrations.contactEmail}
          </a>
          .
        </p>
      </div>
    </div>
  );
}
