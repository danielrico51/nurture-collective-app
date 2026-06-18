"use client";

import LeadCoordinatorSelect from "@/components/Admin/LeadCoordinatorSelect";
import { createAdminClient } from "@/lib/api/clientsClient";
import type { ManualClientChannel } from "@/types/client";
import { MANUAL_CLIENT_CHANNELS } from "@/types/client";
import type { TeamMember } from "@/types/teamMember";
import { useState } from "react";
import toast from "react-hot-toast";

interface ClientManualFormProps {
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
  channel: "phone" as ManualClientChannel,
  locationZip: "",
  tags: "",
  notes: "",
  coordinatorId: defaultCoordinatorId,
});

const ClientManualForm = ({
  members,
  membersLoading = false,
  defaultCoordinatorId = "",
  onCreated,
  onCancel,
}: ClientManualFormProps) => {
  const [form, setForm] = useState(emptyForm(defaultCoordinatorId));
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await createAdminClient({
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        channel: form.channel,
        locationZip: form.locationZip.trim() || null,
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        notes: form.notes.trim() || undefined,
        coordinatorId: form.coordinatorId || undefined,
      });
      toast.success("Client added");
      setForm(emptyForm(defaultCoordinatorId));
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create client");
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
            Add client manually
          </h3>
          <p className="mt-1 text-sm text-nurture-charcoal/65">
            For clients who did not come through a lead — referrals, returning
            families, or partners. Link a lead or app user later.
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
                channel: event.target.value as ManualClientChannel,
              }))
            }
            className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
          >
            {MANUAL_CLIENT_CHANNELS.map((item) => (
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

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
            Tags (comma separated)
          </span>
          <input
            value={form.tags}
            onChange={(event) =>
              setForm((current) => ({ ...current, tags: event.target.value }))
            }
            placeholder="postpartum, vip"
            className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
          />
        </label>

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
            placeholder="Context, referral details, or next steps…"
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
          {saving ? "Saving…" : "Add client"}
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

export default ClientManualForm;
