"use client";

import {
  createEngagementPayout,
  createEngagementShift,
  createEngagementShiftsFromLabel,
  formatEngagementMoney,
  parseDollarsToCents,
  updateEngagementPayout,
  updateEngagementShift,
} from "@/lib/api/scheduleClient";
import type { ProviderRecord } from "@/types/provider";
import type {
  ScheduleShiftWithProvider,
  ServiceEngagementWithDetails,
  ShiftStatus,
  ShiftType,
} from "@/types/serviceEngagement";
import { useState } from "react";
import toast from "react-hot-toast";

interface EngagementOperationsPanelProps {
  clientId: string;
  engagement: ServiceEngagementWithDetails;
  providers: ProviderRecord[];
  saving: boolean;
  onSavingChange: (saving: boolean) => void;
  onChanged: () => Promise<void>;
}

const formatDate = (value: string | null | undefined): string => {
  if (!value) return "—";
  const date = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const SHIFT_TYPE_LABELS: Record<ShiftType, string> = {
  day: "Day",
  night: "Night",
  unknown: "—",
};

const SHIFT_STATUS_LABELS: Record<ShiftStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
};

const EngagementOperationsPanel = ({
  clientId,
  engagement,
  providers,
  saving,
  onSavingChange,
  onChanged,
}: EngagementOperationsPanelProps) => {
  const defaultProviderId =
    engagement.primaryProviderId || providers[0]?.providerId || "";

  const [showShiftForm, setShowShiftForm] = useState(false);
  const [showBulkShifts, setShowBulkShifts] = useState(false);
  const [showPayoutForm, setShowPayoutForm] = useState(false);

  const [shiftProviderId, setShiftProviderId] = useState(defaultProviderId);
  const [shiftDate, setShiftDate] = useState("");
  const [shiftHours, setShiftHours] = useState("");
  const [shiftType, setShiftType] = useState<ShiftType>("unknown");

  const [visitDatesLabel, setVisitDatesLabel] = useState("");
  const [bulkProviderId, setBulkProviderId] = useState(defaultProviderId);
  const [bulkHours, setBulkHours] = useState("");
  const [bulkShiftType, setBulkShiftType] = useState<ShiftType>("unknown");

  const [payoutProviderId, setPayoutProviderId] = useState(defaultProviderId);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutDoulaFee, setPayoutDoulaFee] = useState("");
  const [payoutHours, setPayoutHours] = useState("");
  const [payoutVisitLabel, setPayoutVisitLabel] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");

  const runAction = async (action: () => Promise<void>) => {
    onSavingChange(true);
    try {
      await action();
      await onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      onSavingChange(false);
    }
  };

  const handleAddShift = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!shiftProviderId || !shiftDate) {
      toast.error("Provider and date are required");
      return;
    }
    await runAction(async () => {
      await createEngagementShift(clientId, engagement.engagementId, {
        providerId: shiftProviderId,
        shiftDate,
        hours: shiftHours ? Number(shiftHours) : null,
        shiftType,
      });
      toast.success("Shift added");
      setShiftDate("");
      setShiftHours("");
      setShowShiftForm(false);
    });
  };

  const handleBulkShifts = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!bulkProviderId || !visitDatesLabel.trim()) {
      toast.error("Provider and visit dates label are required");
      return;
    }
    await runAction(async () => {
      await createEngagementShiftsFromLabel(clientId, engagement.engagementId, {
        providerId: bulkProviderId,
        visitDatesLabel: visitDatesLabel.trim(),
        hoursPerShift: bulkHours ? Number(bulkHours) : null,
        shiftType: bulkShiftType,
      });
      toast.success("Shifts created from label");
      setVisitDatesLabel("");
      setShowBulkShifts(false);
    });
  };

  const handleAddPayout = async (event: React.FormEvent) => {
    event.preventDefault();
    const amountCents = parseDollarsToCents(payoutAmount);
    if (!payoutProviderId || amountCents === null) {
      toast.error("Provider and valid payout amount are required");
      return;
    }
    await runAction(async () => {
      await createEngagementPayout(clientId, engagement.engagementId, {
        providerId: payoutProviderId,
        amountCents,
        doulaFeeCents: parseDollarsToCents(payoutDoulaFee),
        hours: payoutHours ? Number(payoutHours) : null,
        visitDatesLabel: payoutVisitLabel.trim(),
        notes: payoutNotes,
      });
      toast.success("Payout batch added");
      setPayoutAmount("");
      setPayoutDoulaFee("");
      setPayoutHours("");
      setPayoutVisitLabel("");
      setPayoutNotes("");
      setShowPayoutForm(false);
    });
  };

  const markShiftCompleted = async (shift: ScheduleShiftWithProvider) => {
    if (shift.status === "completed") return;
    await runAction(async () => {
      await updateEngagementShift(
        clientId,
        engagement.engagementId,
        shift.shiftId,
        { status: "completed" }
      );
      toast.success("Shift marked completed");
    });
  };

  const markPayoutPaid = async (payoutBatchId: string) => {
    await runAction(async () => {
      await updateEngagementPayout(
        clientId,
        engagement.engagementId,
        payoutBatchId,
        { markPaid: true }
      );
      toast.success("Payout marked paid");
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/50">
            Visit shifts ({engagement.shifts.length})
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setShowShiftForm((current) => !current);
                setShowBulkShifts(false);
              }}
              className="rounded-full border border-nurture-sage/30 px-3 py-1 text-xs font-medium disabled:opacity-50"
            >
              {showShiftForm ? "Cancel" : "Add shift"}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setShowBulkShifts((current) => !current);
                setShowShiftForm(false);
              }}
              className="rounded-full border border-nurture-sage/30 px-3 py-1 text-xs font-medium disabled:opacity-50"
            >
              {showBulkShifts ? "Cancel" : "Bulk dates"}
            </button>
          </div>
        </div>

        {showShiftForm ? (
          <form
            onSubmit={(event) => void handleAddShift(event)}
            className="grid gap-3 rounded-xl border border-nurture-sage/15 bg-white p-4 sm:grid-cols-2"
          >
            <label className="block text-sm">
              <span className="font-medium">Provider</span>
              <select
                required
                value={shiftProviderId}
                onChange={(event) => setShiftProviderId(event.target.value)}
                className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
              >
                <option value="">Select…</option>
                {providers.map((provider) => (
                  <option key={provider.providerId} value={provider.providerId}>
                    {provider.displayName}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium">Date</span>
              <input
                type="date"
                required
                value={shiftDate}
                onChange={(event) => setShiftDate(event.target.value)}
                className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Hours</span>
              <input
                type="number"
                min="0"
                step="0.5"
                value={shiftHours}
                onChange={(event) => setShiftHours(event.target.value)}
                className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Type</span>
              <select
                value={shiftType}
                onChange={(event) => setShiftType(event.target.value as ShiftType)}
                className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
              >
                <option value="unknown">Unknown</option>
                <option value="day">Day</option>
                <option value="night">Night</option>
              </select>
            </label>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-nurture-sage px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 sm:col-span-2 sm:w-fit"
            >
              Save shift
            </button>
          </form>
        ) : null}

        {showBulkShifts ? (
          <form
            onSubmit={(event) => void handleBulkShifts(event)}
            className="space-y-3 rounded-xl border border-nurture-sage/15 bg-white p-4"
          >
            <label className="block text-sm">
              <span className="font-medium">Visit dates label</span>
              <input
                required
                value={visitDatesLabel}
                onChange={(event) => setVisitDatesLabel(event.target.value)}
                placeholder="1/17,19,24"
                className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
              />
              <span className="mt-1 block text-xs text-nurture-charcoal/50">
                Spreadsheet-style dates for {engagement.scheduleYear}
              </span>
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-sm">
                <span className="font-medium">Provider</span>
                <select
                  required
                  value={bulkProviderId}
                  onChange={(event) => setBulkProviderId(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
                >
                  {providers.map((provider) => (
                    <option key={provider.providerId} value={provider.providerId}>
                      {provider.displayName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-medium">Hours per shift</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={bulkHours}
                  onChange={(event) => setBulkHours(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Type</span>
                <select
                  value={bulkShiftType}
                  onChange={(event) =>
                    setBulkShiftType(event.target.value as ShiftType)
                  }
                  className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
                >
                  <option value="unknown">Unknown</option>
                  <option value="day">Day</option>
                  <option value="night">Night</option>
                </select>
              </label>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-nurture-sage px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Create shifts
            </button>
          </form>
        ) : null}

        {engagement.shifts.length === 0 ? (
          <p className="text-sm text-nurture-charcoal/55">No shifts scheduled yet.</p>
        ) : (
          <ul className="space-y-2">
            {engagement.shifts.map((shift) => (
              <li
                key={shift.shiftId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-nurture-sage/15 bg-white px-4 py-3 text-sm"
              >
                <div>
                  <span className="font-medium">{formatDate(shift.shiftDate)}</span>
                  <span className="ml-2 text-nurture-charcoal/60">
                    {shift.providerName || "Unknown provider"}
                  </span>
                  {shift.hours != null ? (
                    <span className="ml-2 text-nurture-charcoal/60">
                      {shift.hours} hrs
                    </span>
                  ) : null}
                  <span className="ml-2 text-nurture-charcoal/50">
                    {SHIFT_TYPE_LABELS[shift.shiftType]}
                  </span>
                  <span className="ml-2 text-nurture-charcoal/50">
                    {SHIFT_STATUS_LABELS[shift.status]}
                  </span>
                </div>
                {shift.status !== "completed" ? (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void markShiftCompleted(shift)}
                    className="rounded-full border border-nurture-sage/30 px-3 py-1 text-xs font-medium disabled:opacity-50"
                  >
                    Mark completed
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/50">
            Provider payouts ({engagement.payouts.length})
          </p>
          <button
            type="button"
            disabled={saving}
            onClick={() => setShowPayoutForm((current) => !current)}
            className="rounded-full border border-nurture-sage/30 px-3 py-1 text-xs font-medium disabled:opacity-50"
          >
            {showPayoutForm ? "Cancel" : "Add payout"}
          </button>
        </div>

        {showPayoutForm ? (
          <form
            onSubmit={(event) => void handleAddPayout(event)}
            className="grid gap-3 rounded-xl border border-nurture-sage/15 bg-white p-4 sm:grid-cols-2"
          >
            <label className="block text-sm">
              <span className="font-medium">Provider</span>
              <select
                required
                value={payoutProviderId}
                onChange={(event) => setPayoutProviderId(event.target.value)}
                className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
              >
                {providers.map((provider) => (
                  <option key={provider.providerId} value={provider.providerId}>
                    {provider.displayName}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium">Payout amount ($)</span>
              <input
                required
                value={payoutAmount}
                onChange={(event) => setPayoutAmount(event.target.value)}
                className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Doula fee ($)</span>
              <input
                value={payoutDoulaFee}
                onChange={(event) => setPayoutDoulaFee(event.target.value)}
                className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Hours</span>
              <input
                type="number"
                min="0"
                step="0.5"
                value={payoutHours}
                onChange={(event) => setPayoutHours(event.target.value)}
                className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="font-medium">Visit dates label</span>
              <input
                value={payoutVisitLabel}
                onChange={(event) => setPayoutVisitLabel(event.target.value)}
                placeholder="1/17,19,24 — creates linked shifts if empty batch"
                className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="font-medium">Notes</span>
              <input
                value={payoutNotes}
                onChange={(event) => setPayoutNotes(event.target.value)}
                className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-nurture-sage px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 sm:col-span-2 sm:w-fit"
            >
              Save payout
            </button>
          </form>
        ) : null}

        {engagement.payouts.length === 0 ? (
          <p className="text-sm text-nurture-charcoal/55">No payout batches yet.</p>
        ) : (
          <ul className="space-y-2">
            {engagement.payouts.map((payout) => (
              <li
                key={payout.payoutBatchId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-nurture-sage/15 bg-white px-4 py-3 text-sm"
              >
                <div>
                  <span className="font-medium">
                    {formatEngagementMoney(payout.amountCents)}
                  </span>
                  <span className="ml-2 text-nurture-charcoal/60">
                    {payout.providerName || "Unknown provider"}
                  </span>
                  {payout.visitDatesLabel ? (
                    <span className="ml-2 text-nurture-charcoal/50">
                      {payout.visitDatesLabel}
                    </span>
                  ) : null}
                  {payout.shiftIds.length > 0 ? (
                    <span className="ml-2 text-xs text-nurture-charcoal/45">
                      {payout.shiftIds.length} shift
                      {payout.shiftIds.length === 1 ? "" : "s"}
                    </span>
                  ) : null}
                  <span
                    className={`ml-2 text-xs font-medium ${
                      payout.status === "paid" ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    {payout.status === "paid"
                      ? `paid ${formatDate(payout.paidAt)}`
                      : "pending"}
                  </span>
                </div>
                {payout.status !== "paid" ? (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void markPayoutPaid(payout.payoutBatchId)}
                    className="rounded-full border border-nurture-sage/30 px-3 py-1 text-xs font-medium disabled:opacity-50"
                  >
                    Mark paid
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default EngagementOperationsPanel;
