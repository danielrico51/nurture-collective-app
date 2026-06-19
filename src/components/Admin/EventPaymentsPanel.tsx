"use client";

import { fetchAdminEventRegistrations, updateAdminRegistration } from "@/lib/api/classRegistrationsClient";
import { formatEventPrice } from "@/lib/events/format";
import { formatPaymentStatusLabel } from "@/lib/classRegistrations/payments";
import type {
  ClassRegistration,
  ClassRegistrationPaymentStatus,
} from "@/types/classRegistration";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

interface EventPaymentsPanelProps {
  eventSlug: string;
  priceCents?: number;
  providerFeeCents?: number | null;
  platformFeeCents?: number | null;
}

const PAYMENT_STATUS_LABELS: Record<ClassRegistrationPaymentStatus, string> = {
  unpaid: "Unpaid",
  pending: "Pending",
  paid: "Paid",
  refunded: "Refunded",
};

const isPaymentRelevant = (registration: ClassRegistration) =>
  registration.amountCents > 0 ||
  registration.paymentMethod === "stripe" ||
  registration.paymentMethod === "venmo" ||
  registration.paymentStatus === "paid" ||
  registration.paymentStatus === "pending" ||
  registration.paymentStatus === "refunded";

const EventPaymentsPanel = ({
  eventSlug,
  priceCents,
  providerFeeCents,
  platformFeeCents,
}: EventPaymentsPanelProps) => {
  const [registrations, setRegistrations] = useState<ClassRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminEventRegistrations(eventSlug);
      setRegistrations(data.registrations.filter(isPaymentRelevant));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load payments"
      );
    } finally {
      setLoading(false);
    }
  }, [eventSlug]);

  useEffect(() => {
    void loadRegistrations();
  }, [loadRegistrations]);

  const summary = useMemo(() => {
    let paidCents = 0;
    let pendingCount = 0;
    let unpaidCount = 0;

    for (const registration of registrations) {
      if (registration.paymentStatus === "paid") {
        paidCents += registration.amountCents;
      } else if (registration.paymentStatus === "pending") {
        pendingCount += 1;
      } else if (
        registration.amountCents > 0 &&
        registration.paymentStatus === "unpaid"
      ) {
        unpaidCount += 1;
      }
    }

    return { paidCents, pendingCount, unpaidCount };
  }, [registrations]);

  const feeSplitSummary = useMemo(() => {
    const paidCount = registrations.filter(
      (registration) => registration.paymentStatus === "paid"
    ).length;
    const providerPerSeat = providerFeeCents ?? 0;
    const platformPerSeat = platformFeeCents ?? 0;
    return {
      paidCount,
      providerTotalCents: paidCount * providerPerSeat,
      platformTotalCents: paidCount * platformPerSeat,
      hasSplit: providerPerSeat > 0 || platformPerSeat > 0,
    };
  }, [registrations, providerFeeCents, platformFeeCents]);

  const handlePaymentStatusChange = async (
    registration: ClassRegistration,
    paymentStatus: ClassRegistrationPaymentStatus
  ) => {
    if (paymentStatus === registration.paymentStatus) return;
    setUpdatingId(registration.id);
    try {
      const { registration: updated } = await updateAdminRegistration(
        registration.id,
        { paymentStatus }
      );
      setRegistrations((prev) =>
        prev.map((entry) => (entry.id === updated.id ? updated : entry))
      );
      toast.success("Payment status updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update payment"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const classFeeLabel = formatEventPrice(priceCents);

  if (loading) {
    return (
      <p className="text-sm text-nurture-charcoal/60">Loading payments…</p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-serif text-lg font-semibold text-nurture-charcoal">
          Payments
        </h3>
        <p className="mt-1 text-sm text-nurture-charcoal/65">
          Stripe checkouts and Venmo payments for this class
          {classFeeLabel ? ` (${classFeeLabel} fee)` : ""}.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-nurture-sage/15 bg-nurture-cream/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/55">
            Collected
          </p>
          <p className="mt-1 text-lg font-semibold text-nurture-charcoal">
            {formatEventPrice(summary.paidCents) ?? "$0.00"}
          </p>
        </div>
        <div className="rounded-xl border border-nurture-sage/15 bg-nurture-cream/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/55">
            Venmo pending
          </p>
          <p className="mt-1 text-lg font-semibold text-nurture-charcoal">
            {summary.pendingCount}
          </p>
        </div>
        <div className="rounded-xl border border-nurture-sage/15 bg-nurture-cream/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/55">
            Unpaid
          </p>
          <p className="mt-1 text-lg font-semibold text-nurture-charcoal">
            {summary.unpaidCount}
          </p>
        </div>
      </div>

      {feeSplitSummary.hasSplit ? (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/80">
            Internal fee split
          </p>
          <p className="mt-1 text-sm text-nurture-charcoal/70">
            Per seat: provider {formatEventPrice(providerFeeCents ?? undefined) ?? "$0.00"} ·
            our fee {formatEventPrice(platformFeeCents ?? undefined) ?? "$0.00"}
          </p>
          <p className="mt-2 text-sm font-medium text-nurture-charcoal">
            From {feeSplitSummary.paidCount} paid registration
            {feeSplitSummary.paidCount === 1 ? "" : "s"}: provider{" "}
            {formatEventPrice(feeSplitSummary.providerTotalCents) ?? "$0.00"} ·
            our fee{" "}
            {formatEventPrice(feeSplitSummary.platformTotalCents) ?? "$0.00"}
          </p>
        </div>
      ) : null}

      {registrations.length === 0 ? (
        <p className="text-sm text-nurture-charcoal/60">
          No paid registrations yet for this class.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-nurture-sage/15">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-nurture-cream/50 text-xs uppercase tracking-wide text-nurture-charcoal/55">
              <tr>
                <th className="px-3 py-2 font-semibold">Registrant</th>
                <th className="px-3 py-2 font-semibold">Amount</th>
                <th className="px-3 py-2 font-semibold">Method</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Reference</th>
                <th className="px-3 py-2 font-semibold">Paid at</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nurture-sage/10">
              {registrations.map((registration) => (
                <tr key={registration.id}>
                  <td className="px-3 py-2">
                    <p className="font-medium text-nurture-charcoal">
                      {registration.registrantName}
                    </p>
                    <p className="text-xs text-nurture-charcoal/60">
                      {registration.registrantEmail}
                    </p>
                  </td>
                  <td className="px-3 py-2 text-nurture-charcoal/75">
                    {formatEventPrice(registration.amountCents) ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-nurture-charcoal/75">
                    {registration.paymentMethod ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    {registration.amountCents > 0 ? (
                      <select
                        value={registration.paymentStatus}
                        disabled={updatingId === registration.id}
                        onChange={(event) =>
                          void handlePaymentStatusChange(
                            registration,
                            event.target.value as ClassRegistrationPaymentStatus
                          )
                        }
                        className="rounded-lg border border-nurture-sage/25 px-2 py-1 text-xs"
                      >
                        {(
                          Object.keys(
                            PAYMENT_STATUS_LABELS
                          ) as ClassRegistrationPaymentStatus[]
                        ).map((status) => (
                          <option key={status} value={status}>
                            {PAYMENT_STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-nurture-charcoal/50">
                        {formatPaymentStatusLabel(registration)}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-nurture-charcoal/60">
                    {registration.paymentReference ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-nurture-charcoal/60">
                    {registration.paidAt
                      ? new Date(registration.paidAt).toLocaleString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        type="button"
        onClick={() => void loadRegistrations()}
        className="rounded-full border border-nurture-sage/30 px-3 py-1.5 text-xs font-medium text-nurture-sage-dark hover:bg-nurture-sage/10"
      >
        Refresh payments
      </button>
    </div>
  );
};

export default EventPaymentsPanel;
