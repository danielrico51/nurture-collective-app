"use client";

import { updateAdminLead } from "@/lib/api/leadsClient";
import {
  formatLeadSnapshotDueDate,
  formatLeadSnapshotFee,
  formatLeadSnapshotGender,
  resolveLeadSnapshotDisplay,
} from "@/lib/leads/snapshotView";
import type { IntakeProfile } from "@/types/intake";
import {
  EXPECTED_BABY_GENDER_OPTIONS,
  type ExpectedBabyGender,
  type LeadRecord,
} from "@/types/lead";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface LeadSnapshotPanelProps {
  lead: LeadRecord;
  intake?: IntakeProfile | null;
  disabled?: boolean;
  onSaved: (lead: LeadRecord) => void;
}

const centsToDollars = (cents: number | null): string => {
  if (cents == null || cents <= 0) return "";
  return (cents / 100).toFixed(2);
};

const LeadSnapshotPanel = ({
  lead,
  intake = null,
  disabled = false,
  onSaved,
}: LeadSnapshotPanelProps) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(lead.name);
  const [partnerName, setPartnerName] = useState(lead.partnerName ?? "");
  const [phone, setPhone] = useState(lead.phone);
  const [email, setEmail] = useState(lead.email);
  const [dueDate, setDueDate] = useState(lead.dueDate ?? "");
  const [expectedBabyGender, setExpectedBabyGender] = useState<
    ExpectedBabyGender | ""
  >(lead.expectedBabyGender ?? "");
  const [hospitalName, setHospitalName] = useState(lead.hospitalName ?? "");
  const [locationAddress, setLocationAddress] = useState(
    lead.locationAddress ?? ""
  );
  const [locationZip, setLocationZip] = useState(lead.locationZip ?? "");
  const [feeQuotedAmount, setFeeQuotedAmount] = useState(
    centsToDollars(lead.feeQuotedCents)
  );
  const [feeQuotedNotes, setFeeQuotedNotes] = useState(
    lead.feeQuotedNotes ?? ""
  );

  const resetForm = () => {
    setName(lead.name);
    setPartnerName(lead.partnerName ?? "");
    setPhone(lead.phone);
    setEmail(lead.email);
    setDueDate(lead.dueDate ?? "");
    setExpectedBabyGender(lead.expectedBabyGender ?? "");
    setHospitalName(lead.hospitalName ?? "");
    setLocationAddress(lead.locationAddress ?? "");
    setLocationZip(lead.locationZip ?? "");
    setFeeQuotedAmount(centsToDollars(lead.feeQuotedCents));
    setFeeQuotedNotes(lead.feeQuotedNotes ?? "");
  };

  useEffect(() => {
    if (!editing) resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead, editing]);

  const snapshot = resolveLeadSnapshotDisplay(lead, intake);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { lead: updated } = await updateAdminLead(lead.leadId, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        partnerName: partnerName.trim() || null,
        dueDate: dueDate.trim() || null,
        expectedBabyGender: expectedBabyGender || null,
        hospitalName: hospitalName.trim() || null,
        locationAddress: locationAddress.trim() || null,
        locationZip: locationZip.trim() || null,
        feeQuotedAmount: feeQuotedAmount.trim(),
        feeQuotedNotes: feeQuotedNotes.trim() || null,
      });
      toast.success("Lead snapshot updated");
      onSaved(updated);
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save snapshot");
    } finally {
      setSaving(false);
    }
  };

  const dueDateLabel = snapshot.dueDate
    ? formatLeadSnapshotDueDate(snapshot.dueDate)
    : null;
  const genderLabel = formatLeadSnapshotGender(snapshot.expectedBabyGender);
  const feeLabel = formatLeadSnapshotFee(
    snapshot.feeQuotedCents,
    snapshot.feeQuotedNotes
  );

  if (editing) {
    return (
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="mb-5 overflow-hidden rounded-xl border border-nurture-sage/25 bg-white p-4 shadow-sm"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-nurture-sage-dark">
            Lead snapshot
          </p>
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              resetForm();
              setEditing(false);
            }}
            className="text-xs font-medium text-nurture-charcoal/60 hover:text-nurture-charcoal"
          >
            Cancel
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
              Client name *
            </span>
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
              Partner name
            </span>
            <input
              value={partnerName}
              onChange={(event) => setPartnerName(event.target.value)}
              className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
              Phone
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
              Due date
            </span>
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
              Baby gender
            </span>
            <select
              value={expectedBabyGender}
              onChange={(event) =>
                setExpectedBabyGender(event.target.value as ExpectedBabyGender | "")
              }
              className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
            >
              <option value="">Not specified</option>
              {EXPECTED_BABY_GENDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
              Hospital / birth location
            </span>
            <input
              value={hospitalName}
              onChange={(event) => setHospitalName(event.target.value)}
              className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
              Location (street / city)
            </span>
            <input
              value={locationAddress}
              onChange={(event) => setLocationAddress(event.target.value)}
              className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
              ZIP
            </span>
            <input
              value={locationZip}
              onChange={(event) => setLocationZip(event.target.value)}
              className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
              Fee quoted ($)
            </span>
            <input
              inputMode="decimal"
              placeholder="0.00"
              value={feeQuotedAmount}
              onChange={(event) => setFeeQuotedAmount(event.target.value)}
              className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
              Fee notes
            </span>
            <input
              value={feeQuotedNotes}
              onChange={(event) => setFeeQuotedNotes(event.target.value)}
              placeholder="Package, hours, etc."
              className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
            />
          </label>
        </div>

        <p className="mt-3 text-xs text-nurture-charcoal/45">
          Phone or email is required. Shown at the top of every expanded lead.
        </p>

        <button
          type="submit"
          disabled={disabled || saving}
          className="mt-4 rounded-full bg-nurture-sage px-4 py-2 text-sm font-semibold text-white hover:bg-nurture-sage-dark disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save snapshot"}
        </button>
      </form>
    );
  }

  return (
    <div className="mb-5 overflow-hidden rounded-xl border border-nurture-sage/25 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-nurture-sage-dark">
            Lead snapshot
          </p>
          <p className="mt-1 text-lg font-semibold text-nurture-charcoal">
            {snapshot.clientName || "Unnamed lead"}
          </p>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            resetForm();
            setEditing(true);
          }}
          className="rounded-full border border-nurture-sage/30 px-3 py-1 text-xs font-medium text-nurture-sage-dark disabled:opacity-50"
        >
          Edit
        </button>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-xs text-nurture-charcoal/50">Partner</dt>
          <dd className="text-sm text-nurture-charcoal/85">
            {snapshot.partnerName || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-nurture-charcoal/50">Phone</dt>
          <dd className="text-sm text-nurture-charcoal/85">
            {snapshot.phone || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-nurture-charcoal/50">Email</dt>
          <dd className="break-all text-sm text-nurture-charcoal/85">
            {snapshot.email || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-nurture-charcoal/50">Due date</dt>
          <dd className="text-sm text-nurture-charcoal/85">
            {dueDateLabel || "—"}
            {snapshot.dueDateFromIntake ? (
              <span className="ml-1 text-xs text-nurture-charcoal/45">(intake)</span>
            ) : null}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-nurture-charcoal/50">Baby</dt>
          <dd className="text-sm text-nurture-charcoal/85">{genderLabel || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-nurture-charcoal/50">Hospital</dt>
          <dd className="text-sm text-nurture-charcoal/85">
            {snapshot.hospitalName || "—"}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs text-nurture-charcoal/50">Location</dt>
          <dd className="text-sm text-nurture-charcoal/85">
            {snapshot.location || "—"}
            {snapshot.locationFromIntake ? (
              <span className="ml-1 text-xs text-nurture-charcoal/45">(intake)</span>
            ) : null}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-nurture-charcoal/50">Fee quoted</dt>
          <dd className="text-sm text-nurture-charcoal/85">{feeLabel || "—"}</dd>
        </div>
      </dl>
    </div>
  );
};

export default LeadSnapshotPanel;
