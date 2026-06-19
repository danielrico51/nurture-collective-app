"use client";

import {
  MATERNAL_STAGE_LABELS,
  MATERNAL_STAGES,
  SUPPORT_INTERESTS,
  SUPPORT_INTEREST_LABELS,
} from "@/content/intake";
import { updateAdminLead } from "@/lib/api/leadsClient";
import type { LeadRecord } from "@/types/lead";
import type { MaternalStage, SupportInterest } from "@/types/intake";
import { useState } from "react";
import toast from "react-hot-toast";

interface LeadContactEditFormProps {
  lead: LeadRecord;
  disabled?: boolean;
  onSaved: (lead: LeadRecord) => void;
}

const LeadContactEditForm = ({
  lead,
  disabled = false,
  onSaved,
}: LeadContactEditFormProps) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(lead.name);
  const [email, setEmail] = useState(lead.email);
  const [phone, setPhone] = useState(lead.phone);
  const [locationZip, setLocationZip] = useState(lead.locationZip ?? "");
  const [maternalStage, setMaternalStage] = useState(lead.maternalStage ?? "");
  const [supportInterests, setSupportInterests] = useState<string[]>(
    lead.supportInterests
  );
  const [challengesSummary, setChallengesSummary] = useState(
    lead.challengesSummary
  );

  const resetForm = () => {
    setName(lead.name);
    setEmail(lead.email);
    setPhone(lead.phone);
    setLocationZip(lead.locationZip ?? "");
    setMaternalStage(lead.maternalStage ?? "");
    setSupportInterests(lead.supportInterests);
    setChallengesSummary(lead.challengesSummary);
  };

  const stageLabel = lead.maternalStage
    ? MATERNAL_STAGE_LABELS[lead.maternalStage as MaternalStage] ??
      lead.maternalStage
    : "—";

  const interestsLabel =
    lead.supportInterests
      .map(
        (item) =>
          SUPPORT_INTEREST_LABELS[item as SupportInterest] ?? item
      )
      .join(", ") || "—";

  const toggleInterest = (interest: SupportInterest) => {
    setSupportInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest]
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { lead: updated } = await updateAdminLead(lead.leadId, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        locationZip: locationZip.trim() || null,
        maternalStage: maternalStage || null,
        supportInterests,
        challengesSummary: challengesSummary.trim(),
      });
      toast.success("Contact information updated");
      onSaved(updated);
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save contact info");
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="mb-5 rounded-xl border border-nurture-sage/15 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/50">
            Contact information
          </p>
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
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-nurture-charcoal/50">Name</dt>
            <dd className="text-sm font-medium text-nurture-charcoal">
              {lead.name || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-nurture-charcoal/50">Email</dt>
            <dd className="text-sm text-nurture-charcoal/80">{lead.email || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-nurture-charcoal/50">Phone</dt>
            <dd className="text-sm text-nurture-charcoal/80">{lead.phone || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-nurture-charcoal/50">ZIP</dt>
            <dd className="text-sm text-nurture-charcoal/80">
              {lead.locationZip || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-nurture-charcoal/50">Maternal stage</dt>
            <dd className="text-sm text-nurture-charcoal/80">{stageLabel}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-nurture-charcoal/50">Support interests</dt>
            <dd className="text-sm text-nurture-charcoal/80">{interestsLabel}</dd>
          </div>
          {lead.challengesSummary ? (
            <div className="sm:col-span-2">
              <dt className="text-xs text-nurture-charcoal/50">Challenges / notes</dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-sm text-nurture-charcoal/80">
                {lead.challengesSummary}
              </dd>
            </div>
          ) : null}
        </dl>
        {lead.isGuest ? (
          <p className="mt-3 text-xs text-nurture-charcoal/45">
            Updates apply to this lead record in the CRM.
          </p>
        ) : (
          <p className="mt-3 text-xs text-nurture-charcoal/45">
            Updates the lead profile here. Member intake answers in the panel below
            are unchanged unless updated separately.
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="mb-5 space-y-4 rounded-xl border border-nurture-sage/20 bg-white p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/50">
          Edit contact information
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
            Name *
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
            Phone
          </span>
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
            Maternal stage
          </span>
          <select
            value={maternalStage}
            onChange={(event) => setMaternalStage(event.target.value)}
            className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
          >
            <option value="">Not specified</option>
            {MATERNAL_STAGES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
            ZIP code
          </span>
          <input
            value={locationZip}
            onChange={(event) => setLocationZip(event.target.value)}
            className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
          />
        </label>
        <fieldset className="block sm:col-span-2">
          <legend className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
            Support interests
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {SUPPORT_INTERESTS.map((item) => {
              const active = supportInterests.includes(item.value);
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => toggleInterest(item.value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    active
                      ? "bg-nurture-sage text-white"
                      : "border border-nurture-sage/25 text-nurture-charcoal/70 hover:bg-nurture-sage/10"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </fieldset>
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
            Challenges / context
          </span>
          <textarea
            rows={3}
            value={challengesSummary}
            onChange={(event) => setChallengesSummary(event.target.value)}
            placeholder="Brief summary for coordinators…"
            className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
          />
        </label>
      </div>

      <p className="text-xs text-nurture-charcoal/45">
        Phone or email is required.
      </p>

      <button
        type="submit"
        disabled={disabled || saving}
        className="rounded-full bg-nurture-sage px-4 py-2 text-sm font-semibold text-white hover:bg-nurture-sage-dark disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save contact info"}
      </button>
    </form>
  );
};

export default LeadContactEditForm;
