"use client";

import LeadCoordinatorSelect from "@/components/Admin/LeadCoordinatorSelect";
import {
  MATERNAL_STAGES,
  SUPPORT_INTERESTS,
} from "@/content/intake";
import { createAdminLead } from "@/lib/api/leadsClient";
import type { ManualLeadChannel } from "@/types/lead";
import { MANUAL_LEAD_CHANNELS } from "@/types/lead";
import type { SupportInterest } from "@/types/intake";
import type { TeamMember } from "@/types/teamMember";
import { useState } from "react";
import toast from "react-hot-toast";

interface ManualLeadFormProps {
  members: TeamMember[];
  membersLoading?: boolean;
  defaultCoordinatorId?: string;
  onCreated: () => void;
  onCancel: () => void;
}

const emptyForm = (defaultCoordinatorId = "") => ({
  name: "",
  email: "",
  phone: "",
  channel: "phone" as ManualLeadChannel,
  maternalStage: "",
  supportInterests: [] as SupportInterest[],
  locationZip: "",
  notes: "",
  coordinatorId: defaultCoordinatorId,
});

const ManualLeadForm = ({
  members,
  membersLoading = false,
  defaultCoordinatorId = "",
  onCreated,
  onCancel,
}: ManualLeadFormProps) => {
  const [form, setForm] = useState(emptyForm(defaultCoordinatorId));
  const [saving, setSaving] = useState(false);

  const toggleInterest = (interest: SupportInterest) => {
    setForm((current) => ({
      ...current,
      supportInterests: current.supportInterests.includes(interest)
        ? current.supportInterests.filter((item) => item !== interest)
        : [...current.supportInterests, interest],
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await createAdminLead({
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        channel: form.channel,
        maternalStage: form.maternalStage || null,
        supportInterests: form.supportInterests,
        locationZip: form.locationZip.trim() || null,
        notes: form.notes.trim() || undefined,
        coordinatorId: form.coordinatorId || undefined,
      });
      toast.success("Lead added to CRM");
      setForm(emptyForm(defaultCoordinatorId));
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create lead");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-nurture-sage/20 bg-white p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-lg font-semibold text-nurture-charcoal">
            Add lead manually
          </h3>
          <p className="mt-1 text-sm text-nurture-charcoal/65">
            For inquiries that did not go through the website intake — phone
            calls, referrals, events, and similar.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="shrink-0 text-sm text-nurture-charcoal/50 hover:text-nurture-charcoal"
        >
          Close
        </button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
            Name *
          </span>
          <input
            required
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
            Email
          </span>
          <input
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm((current) => ({ ...current, email: event.target.value }))
            }
            className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
            Phone
          </span>
          <input
            type="tel"
            value={form.phone}
            onChange={(event) =>
              setForm((current) => ({ ...current, phone: event.target.value }))
            }
            className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
            How they reached us *
          </span>
          <select
            required
            value={form.channel}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                channel: event.target.value as ManualLeadChannel,
              }))
            }
            className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
          >
            {MANUAL_LEAD_CHANNELS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
            Maternal stage
          </span>
          <select
            value={form.maternalStage}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                maternalStage: event.target.value,
              }))
            }
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
            value={form.locationZip}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                locationZip: event.target.value,
              }))
            }
            className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
          />
        </label>

        <fieldset className="block sm:col-span-2">
          <legend className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
            Support interests
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {SUPPORT_INTERESTS.map((item) => {
              const active = form.supportInterests.includes(item.value);
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => toggleInterest(item.value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? "bg-nurture-sage text-white"
                      : "bg-nurture-cream text-nurture-charcoal/70 hover:bg-nurture-sage/10"
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
            Notes
          </span>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(event) =>
              setForm((current) => ({ ...current, notes: event.target.value }))
            }
            placeholder="Context from the call, referral details, or next steps…"
            className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
          />
        </label>

        <LeadCoordinatorSelect
          value={form.coordinatorId}
          members={members}
          membersLoading={membersLoading}
          onChange={(coordinatorId) =>
            setForm((current) => ({ ...current, coordinatorId }))
          }
          className="sm:col-span-2"
        />
      </div>

      <p className="mt-3 text-xs text-nurture-charcoal/50">
        Provide at least a phone number or email address.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-nurture-sage px-5 py-2 text-sm font-semibold text-white transition hover:bg-nurture-sage-dark disabled:opacity-60"
        >
          {saving ? "Saving…" : "Add lead"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-nurture-sage/30 px-5 py-2 text-sm font-medium text-nurture-sage-dark hover:bg-nurture-sage/10"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ManualLeadForm;
