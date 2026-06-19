"use client";

import ClientsCrmStorageNote from "@/components/Admin/ClientsCrmStorageNote";
import EngagementEditForm from "@/components/Admin/EngagementEditForm";
import EngagementOperationsPanel from "@/components/Admin/EngagementOperationsPanel";
import {
  createClientEngagement,
  ENGAGEMENT_SERVICE_TYPE_LABELS,
  ENGAGEMENT_STATUS_LABELS,
  fetchClientEngagements,
  formatEngagementMoney,
  parseDollarsToCents,
  updateClientEngagement,
  updatePaymentExpectation,
} from "@/lib/api/scheduleClient";
import { PAYMENT_METHODS } from "@/config/paymentMethods";
import { fetchAdminProviders } from "@/lib/api/providersClient";
import type { PaymentMethodId } from "@/types/clientService";
import type { ProviderRecord } from "@/types/provider";
import type { ClientsCrmStorageScope } from "@/types/client";
import type {
  EngagementStatus,
  ServiceEngagementWithDetails,
} from "@/types/serviceEngagement";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

interface ClientScheduleTabProps {
  clientId: string;
  onChanged?: () => void;
  onCountChange?: (count: number) => void;
}

const formatDate = (value: string | null | undefined): string => {
  if (!value) return "—";
  const date = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const paymentMethodLabel = (method: PaymentMethodId | null | undefined): string =>
  PAYMENT_METHODS.find((item) => item.id === method)?.label ?? "Not set";

const STATUS_BADGE: Record<EngagementStatus, string> = {
  booked: "bg-sky-100 text-sky-800",
  active: "bg-emerald-100 text-emerald-800",
  completed: "bg-nurture-cream text-nurture-charcoal/70",
  cancelled: "bg-nurture-charcoal/10 text-nurture-charcoal/60",
};

const ClientScheduleTab = ({
  clientId,
  onChanged,
  onCountChange,
}: ClientScheduleTabProps) => {
  const [engagements, setEngagements] = useState<ServiceEngagementWithDetails[]>(
    []
  );
  const [providers, setProviders] = useState<ProviderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [storageScope, setStorageScope] = useState<ClientsCrmStorageScope | null>(
    null
  );

  const [bookDate, setBookDate] = useState(new Date().toISOString().slice(0, 10));
  const [estimatedDate, setEstimatedDate] = useState("");
  const [estimatedNotes, setEstimatedNotes] = useState("");
  const [primaryProviderId, setPrimaryProviderId] = useState("");
  const [scheduleYear, setScheduleYear] = useState(
    String(new Date().getFullYear())
  );
  const [clientFee, setClientFee] = useState("");
  const [hoursTotal, setHoursTotal] = useState("");
  const [schedulePattern, setSchedulePattern] = useState("");
  const [doulaFee, setDoulaFee] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositPaidAt, setDepositPaidAt] = useState("");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceDueDate, setBalanceDueDate] = useState("");
  const [balanceDueLabel, setBalanceDueLabel] = useState("");
  const [preferredPaymentMethod, setPreferredPaymentMethod] = useState<
    PaymentMethodId | ""
  >("");

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [engagementData, providerData] = await Promise.all([
        fetchClientEngagements(clientId),
        fetchAdminProviders(),
      ]);
      setEngagements(engagementData.engagements);
      setStorageScope(engagementData.storage ?? null);
      setProviders(providerData.providers.filter((p) => !p.archivedAt));
      onCountChange?.(engagementData.engagements.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load schedule");
    } finally {
      setLoading(false);
    }
  }, [clientId, onCountChange]);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () => {
    setBookDate(new Date().toISOString().slice(0, 10));
    setEstimatedDate("");
    setEstimatedNotes("");
    setPrimaryProviderId("");
    setScheduleYear(String(new Date().getFullYear()));
    setClientFee("");
    setHoursTotal("");
    setSchedulePattern("");
    setDoulaFee("");
    setDepositAmount("");
    setDepositPaidAt("");
    setBalanceAmount("");
    setBalanceDueDate("");
    setBalanceDueLabel("");
    setPreferredPaymentMethod("");
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    const clientFeeCents = parseDollarsToCents(clientFee);
    if (clientFeeCents === null) {
      toast.error("Enter a valid client fee");
      return;
    }

    setSaving(true);
    try {
      await createClientEngagement(clientId, {
        bookDate,
        scheduleYear: Number(scheduleYear),
        primaryProviderId: primaryProviderId || null,
        estimatedDate: estimatedDate || null,
        estimatedNotes,
        preferredPaymentMethod: preferredPaymentMethod || null,
        package: {
          clientFeeCents,
          hoursTotal: hoursTotal ? Number(hoursTotal) : null,
          schedulePattern,
          doulaFeeCents: parseDollarsToCents(doulaFee),
        },
        deposit: depositAmount
          ? {
              kind: "deposit",
              amountCents: parseDollarsToCents(depositAmount) ?? 0,
              paidAt: depositPaidAt || null,
            }
          : undefined,
        balance: balanceAmount
          ? {
              kind: "balance",
              amountCents: parseDollarsToCents(balanceAmount) ?? 0,
              dueDate: balanceDueDate || null,
              dueLabel: balanceDueLabel,
            }
          : undefined,
      });
      toast.success("Engagement created — linked service and billing record added");
      setShowForm(false);
      resetForm();
      await load();
      onChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create engagement");
    } finally {
      setSaving(false);
    }
  };

  const markExpectationPaid = async (
    engagement: ServiceEngagementWithDetails,
    expectationId: string
  ) => {
    setSaving(true);
    try {
      await updatePaymentExpectation(
        clientId,
        engagement.engagementId,
        expectationId,
        { paidAt: new Date().toISOString() }
      );
      toast.success("Marked as paid");
      await load();
      onChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (
    engagement: ServiceEngagementWithDetails,
    status: EngagementStatus
  ) => {
    setSaving(true);
    try {
      await updateClientEngagement(clientId, engagement.engagementId, { status });
      toast.success("Status updated");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-nurture-charcoal/60">Loading schedule…</p>;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-nurture-charcoal/65">
          Book postpartum engagements with package details, deposit/balance schedule,
          visit shifts, provider payouts, and a linked service for invoicing.
          <ClientsCrmStorageNote
            storage={storageScope}
            prodLabel="Production schedule data"
          />
        </p>
        <button
          type="button"
          onClick={() => setShowForm((current) => !current)}
          className="rounded-full bg-nurture-sage px-4 py-2 text-sm font-semibold text-white"
        >
          {showForm ? "Close" : "Book engagement"}
        </button>
      </div>

      {showForm ? (
        <form
          onSubmit={(event) => void handleCreate(event)}
          className="space-y-4 rounded-2xl border border-nurture-sage/20 bg-white p-5"
        >
          <h3 className="font-serif text-lg font-semibold text-nurture-charcoal">
            New engagement
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
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
                placeholder="5400"
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
                placeholder="9 (8) hr days"
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
          </div>

          <fieldset className="rounded-xl border border-nurture-sage/15 p-4">
            <legend className="px-1 text-sm font-semibold text-nurture-charcoal">
              Client payments (optional)
            </legend>
            <div className="mt-2 grid gap-4 sm:grid-cols-2">
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
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </label>
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
              <label className="block text-sm sm:col-span-2">
                <span className="font-medium">Balance due label</span>
                <input
                  value={balanceDueLabel}
                  onChange={(event) => setBalanceDueLabel(event.target.value)}
                  placeholder="after 1st wk"
                  className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
                />
              </label>
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-nurture-sage px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Create engagement"}
          </button>
        </form>
      ) : null}

      {engagements.length === 0 ? (
        <p className="text-sm text-nurture-charcoal/60">
          No engagements yet. Book one to replace a spreadsheet row.
        </p>
      ) : (
        <ul className="space-y-3">
          {engagements.map((engagement) => {
            const expanded = expandedId === engagement.engagementId;
            const primaryPackage = engagement.packages[0];
            return (
              <li
                key={engagement.engagementId}
                className="overflow-hidden rounded-2xl border border-nurture-sage/20 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => {
                    setExpandedId(expanded ? null : engagement.engagementId);
                    if (expanded) setEditingId(null);
                  }}
                  className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-nurture-charcoal">
                        {ENGAGEMENT_SERVICE_TYPE_LABELS[engagement.serviceType]}{" "}
                        {engagement.scheduleYear}
                      </span>
                      <span className="text-sm text-nurture-charcoal/60">
                        booked {formatDate(engagement.bookDate)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-nurture-charcoal/60">
                      {engagement.primaryProviderName || "Unassigned"} · est.{" "}
                      {formatDate(engagement.estimatedDate)}
                      {engagement.estimatedNotes
                        ? ` (${engagement.estimatedNotes})`
                        : ""}
                    </p>
                    <p className="mt-1 text-sm font-medium text-nurture-charcoal">
                      {formatEngagementMoney(engagement.totalClientFeeCents)}
                      {primaryPackage?.schedulePattern
                        ? ` · ${primaryPackage.schedulePattern}`
                        : ""}
                      {engagement.preferredPaymentMethod ? (
                        <span className="font-normal text-nurture-charcoal/60">
                          {" "}
                          · pay via{" "}
                          {paymentMethodLabel(engagement.preferredPaymentMethod)}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE[engagement.status]}`}
                  >
                    {ENGAGEMENT_STATUS_LABELS[engagement.status]}
                  </span>
                </button>

                {expanded ? (
                  <div className="space-y-4 border-t border-nurture-sage/15 bg-nurture-cream/30 px-5 py-5">
                    <div className="flex flex-wrap items-center gap-2">
                      {(["booked", "active", "completed", "cancelled"] as EngagementStatus[]).map(
                        (status) => (
                          <button
                            key={status}
                            type="button"
                            disabled={saving || engagement.status === status}
                            onClick={() => void updateStatus(engagement, status)}
                            className="rounded-full border border-nurture-sage/30 px-3 py-1 text-xs font-medium text-nurture-sage-dark disabled:opacity-50"
                          >
                            Mark {ENGAGEMENT_STATUS_LABELS[status].toLowerCase()}
                          </button>
                        )
                      )}
                      {editingId !== engagement.engagementId ? (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => setEditingId(engagement.engagementId)}
                          className="rounded-full border border-nurture-sage/30 px-3 py-1 text-xs font-medium text-nurture-sage-dark disabled:opacity-50"
                        >
                          Edit details
                        </button>
                      ) : null}
                    </div>

                    {editingId === engagement.engagementId ? (
                      <EngagementEditForm
                        clientId={clientId}
                        engagement={engagement}
                        providers={providers}
                        onSaved={async () => {
                          await load();
                          onChanged?.();
                        }}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      <>
                    {engagement.packages.map((pkg) => (
                      <div
                        key={pkg.packageId}
                        className="rounded-xl border border-nurture-sage/15 bg-white p-4 text-sm"
                      >
                        <p className="font-semibold text-nurture-charcoal">{pkg.label}</p>
                        <p className="mt-1 text-nurture-charcoal/70">
                          Client {formatEngagementMoney(pkg.clientFeeCents)}
                          {pkg.doulaFeeCents != null
                            ? ` · Doula ${formatEngagementMoney(pkg.doulaFeeCents)}`
                            : ""}
                          {pkg.hoursTotal != null ? ` · ${pkg.hoursTotal} hrs` : ""}
                        </p>
                        {pkg.schedulePattern ? (
                          <p className="mt-1 text-nurture-charcoal/60">{pkg.schedulePattern}</p>
                        ) : null}
                      </div>
                    ))}

                    {engagement.preferredPaymentMethod ? (
                      <p className="text-sm text-nurture-charcoal/70">
                        Preferred payment:{" "}
                        <span className="font-medium text-nurture-charcoal">
                          {paymentMethodLabel(engagement.preferredPaymentMethod)}
                        </span>
                      </p>
                    ) : null}

                    {engagement.expectations.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/50">
                          Payment schedule
                        </p>
                        {engagement.expectations.map((expectation) => (
                          <div
                            key={expectation.expectationId}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-nurture-sage/15 bg-white px-4 py-3 text-sm"
                          >
                            <div>
                              <span className="font-medium capitalize">
                                {expectation.kind}
                              </span>
                              <span className="ml-2">
                                {formatEngagementMoney(expectation.amountCents)}
                              </span>
                              <span className="ml-2 text-nurture-charcoal/60">
                                due {formatDate(expectation.dueDate)}
                                {expectation.dueLabel
                                  ? ` (${expectation.dueLabel})`
                                  : ""}
                              </span>
                              {expectation.paidAt ? (
                                <span className="ml-2 text-emerald-700">
                                  paid {formatDate(expectation.paidAt)}
                                </span>
                              ) : null}
                              {expectation.invoiceId ? (
                                <span className="ml-2 text-xs text-nurture-charcoal/50">
                                  invoice linked
                                </span>
                              ) : null}
                            </div>
                            {!expectation.paidAt ? (
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() =>
                                  void markExpectationPaid(
                                    engagement,
                                    expectation.expectationId
                                  )
                                }
                                className="rounded-full border border-nurture-sage/30 px-3 py-1 text-xs font-medium"
                              >
                                Mark paid
                              </button>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                      </>
                    )}

                    <EngagementOperationsPanel
                      clientId={clientId}
                      engagement={engagement}
                      providers={providers}
                      saving={saving}
                      onSavingChange={setSaving}
                      onChanged={load}
                    />

                    {engagement.service ? (
                      <p className="text-xs text-nurture-charcoal/55">
                        Linked service: {engagement.service.title} · paid{" "}
                        {formatEngagementMoney(engagement.service.paidCents)} · balance{" "}
                        {formatEngagementMoney(engagement.service.balanceDueCents)}.
                        Send invoices from the Services tab.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ClientScheduleTab;
