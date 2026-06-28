"use client";

import {
  ENGAGEMENT_SERVICE_TYPE_LABELS,
  formatCentsToDollars,
  parseDollarsToCents,
  updateClientEngagement,
  updateEngagementPackage,
  updatePaymentExpectation,
} from "@/lib/api/scheduleClient";
import { ENGAGEMENT_PAYMENT_METHODS, getPaymentMethod } from "@/config/paymentMethods";
import type { ProviderRecord } from "@/types/provider";
import type { PaymentMethodId } from "@/types/clientService";
import type {
  EngagementServiceType,
  ServiceEngagementWithDetails,
} from "@/types/serviceEngagement";
import { ENGAGEMENT_SERVICE_TYPES } from "@/types/serviceEngagement";
import { useState } from "react";
import toast from "react-hot-toast";

interface EngagementEditFormProps {
  clientId: string;
  engagement: ServiceEngagementWithDetails;
  providers: ProviderRecord[];
  onSaved: () => Promise<void>;
  onCancel: () => void;
}

const toDateInputValue = (value: string | null | undefined): string => {
  if (!value) return "";
  return value.includes("T") ? value.slice(0, 10) : value.slice(0, 10);
};

const EngagementEditForm = ({
  clientId,
  engagement,
  providers,
  onSaved,
  onCancel,
}: EngagementEditFormProps) => {
  const primaryPackage = engagement.packages[0];
  const depositExpectation = engagement.expectations.find(
    (row) => row.kind === "deposit"
  );
  const balanceExpectation = engagement.expectations.find(
    (row) => row.kind === "balance"
  );

  const [saving, setSaving] = useState(false);
  const [serviceType, setServiceType] = useState<EngagementServiceType>(
    engagement.serviceType
  );
  const [bookDate, setBookDate] = useState(toDateInputValue(engagement.bookDate));
  const [estimatedDate, setEstimatedDate] = useState(
    toDateInputValue(engagement.estimatedDate)
  );
  const [estimatedNotes, setEstimatedNotes] = useState(engagement.estimatedNotes);
  const [primaryProviderId, setPrimaryProviderId] = useState(
    engagement.primaryProviderId ?? ""
  );
  const [scheduleYear, setScheduleYear] = useState(String(engagement.scheduleYear));
  const [clientFee, setClientFee] = useState(
    formatCentsToDollars(primaryPackage?.clientFeeCents)
  );
  const [hoursTotal, setHoursTotal] = useState(
    primaryPackage?.hoursTotal != null ? String(primaryPackage.hoursTotal) : ""
  );
  const [schedulePattern, setSchedulePattern] = useState(
    primaryPackage?.schedulePattern ?? ""
  );
  const [doulaFee, setDoulaFee] = useState(
    formatCentsToDollars(primaryPackage?.doulaFeeCents)
  );
  const [depositAmount, setDepositAmount] = useState(
    formatCentsToDollars(depositExpectation?.amountCents)
  );
  const [depositPaidAt, setDepositPaidAt] = useState(
    toDateInputValue(depositExpectation?.paidAt)
  );
  const [balanceAmount, setBalanceAmount] = useState(
    formatCentsToDollars(balanceExpectation?.amountCents)
  );
  const [balanceDueDate, setBalanceDueDate] = useState(
    toDateInputValue(balanceExpectation?.dueDate)
  );
  const [balanceDueLabel, setBalanceDueLabel] = useState(
    balanceExpectation?.dueLabel ?? ""
  );
  const [balancePaidAt, setBalancePaidAt] = useState(
    toDateInputValue(balanceExpectation?.paidAt)
  );
  const [preferredPaymentMethod, setPreferredPaymentMethod] = useState<
    PaymentMethodId | ""
  >(engagement.preferredPaymentMethod ?? "");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const clientFeeCents = parseDollarsToCents(clientFee);
    if (clientFeeCents === null) {
      toast.error("Enter a valid client fee");
      return;
    }

    const depositAmountCents = depositExpectation
      ? parseDollarsToCents(depositAmount)
      : null;
    if (depositExpectation && depositAmountCents === null) {
      toast.error("Enter a valid deposit amount");
      return;
    }

    const balanceAmountCents = balanceExpectation
      ? parseDollarsToCents(balanceAmount)
      : null;
    if (balanceExpectation && balanceAmountCents === null) {
      toast.error("Enter a valid balance amount");
      return;
    }

    setSaving(true);
    try {
      await updateClientEngagement(clientId, engagement.engagementId, {
        serviceType,
        bookDate,
        scheduleYear: Number(scheduleYear),
        primaryProviderId: primaryProviderId || null,
        estimatedDate: estimatedDate || null,
        estimatedNotes,
        preferredPaymentMethod: preferredPaymentMethod || null,
      });

      if (primaryPackage) {
        await updateEngagementPackage(
          clientId,
          engagement.engagementId,
          primaryPackage.packageId,
          {
            clientFeeCents,
            hoursTotal: hoursTotal ? Number(hoursTotal) : null,
            schedulePattern,
            doulaFeeCents: parseDollarsToCents(doulaFee),
          }
        );
      }

      if (depositExpectation && depositAmountCents !== null) {
        await updatePaymentExpectation(
          clientId,
          engagement.engagementId,
          depositExpectation.expectationId,
          {
            amountCents: depositAmountCents,
            paidAt: depositPaidAt || null,
          }
        );
      }

      if (balanceExpectation && balanceAmountCents !== null) {
        await updatePaymentExpectation(
          clientId,
          engagement.engagementId,
          balanceExpectation.expectationId,
          {
            amountCents: balanceAmountCents,
            dueDate: balanceDueDate || null,
            dueLabel: balanceDueLabel,
            paidAt: balancePaidAt || null,
          }
        );
      }

      toast.success("Engagement updated");
      await onSaved();
      onCancel();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save engagement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="space-y-4 rounded-xl border border-nurture-sage/20 bg-white p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-semibold text-nurture-charcoal">Edit engagement</h4>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="text-xs font-medium text-nurture-charcoal/60 hover:text-nurture-charcoal"
        >
          Cancel
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium">Service type</span>
          <select
            value={serviceType}
            onChange={(event) =>
              setServiceType(event.target.value as EngagementServiceType)
            }
            className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
          >
            {ENGAGEMENT_SERVICE_TYPES.map((type) => (
              <option key={type} value={type}>
                {ENGAGEMENT_SERVICE_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium">Book date</span>
          <input
            type="date"
            required
            value={bookDate}
            onChange={(event) => {
              setBookDate(event.target.value);
              setScheduleYear(event.target.value.slice(0, 4));
            }}
            className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Estimated due / birth</span>
          <input
            type="date"
            value={estimatedDate}
            onChange={(event) => setEstimatedDate(event.target.value)}
            className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Schedule year</span>
          <input
            type="number"
            value={scheduleYear}
            onChange={(event) => setScheduleYear(event.target.value)}
            className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Primary provider</span>
          <select
            value={primaryProviderId}
            onChange={(event) => setPrimaryProviderId(event.target.value)}
            className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
          >
            <option value="">Unassigned</option>
            {providers.map((provider) => (
              <option key={provider.providerId} value={provider.providerId}>
                {provider.displayName}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium">Client fee ($)</span>
          <input
            required
            value={clientFee}
            onChange={(event) => setClientFee(event.target.value)}
            className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Doula fee ($)</span>
          <input
            value={doulaFee}
            onChange={(event) => setDoulaFee(event.target.value)}
            className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Total hours</span>
          <input
            type="number"
            min="0"
            value={hoursTotal}
            onChange={(event) => setHoursTotal(event.target.value)}
            className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium">Days / nights pattern</span>
          <input
            value={schedulePattern}
            onChange={(event) => setSchedulePattern(event.target.value)}
            className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium">Estimated notes</span>
          <input
            value={estimatedNotes}
            onChange={(event) => setEstimatedNotes(event.target.value)}
            placeholder="B 1/19, ind 2/4"
            className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium">Preferred payment method</span>
          <select
            value={preferredPaymentMethod}
            onChange={(event) =>
              setPreferredPaymentMethod(event.target.value as PaymentMethodId | "")
            }
            className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
          >
            <option value="">Not specified</option>
            {preferredPaymentMethod &&
            !ENGAGEMENT_PAYMENT_METHODS.some(
              (method) => method.id === preferredPaymentMethod
            ) ? (
              <option value={preferredPaymentMethod}>
                {getPaymentMethod(preferredPaymentMethod)?.label ??
                  preferredPaymentMethod}{" "}
                (legacy)
              </option>
            ) : null}
            {ENGAGEMENT_PAYMENT_METHODS.map((method) => (
              <option key={method.id} value={method.id}>
                {method.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {depositExpectation || balanceExpectation ? (
        <fieldset className="rounded-xl border border-nurture-sage/15 p-4">
          <legend className="px-1 text-sm font-semibold text-nurture-charcoal">
            Client payments
          </legend>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            {depositExpectation ? (
              <>
                <label className="block text-sm">
                  <span className="font-medium">Deposit ($)</span>
                  <input
                    value={depositAmount}
                    onChange={(event) => setDepositAmount(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium">Deposit paid date</span>
                  <input
                    type="date"
                    value={depositPaidAt}
                    onChange={(event) => setDepositPaidAt(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
                  />
                </label>
              </>
            ) : null}
            {balanceExpectation ? (
              <>
                <label className="block text-sm">
                  <span className="font-medium">Balance ($)</span>
                  <input
                    value={balanceAmount}
                    onChange={(event) => setBalanceAmount(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium">Balance due date</span>
                  <input
                    type="date"
                    value={balanceDueDate}
                    onChange={(event) => setBalanceDueDate(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium">Balance paid date</span>
                  <input
                    type="date"
                    value={balancePaidAt}
                    onChange={(event) => setBalancePaidAt(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="font-medium">Balance due label</span>
                  <input
                    value={balanceDueLabel}
                    onChange={(event) => setBalanceDueLabel(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
                  />
                </label>
              </>
            ) : null}
          </div>
        </fieldset>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-nurture-sage px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
};

export default EngagementEditForm;
