"use client";

import {
  createAdminProvider,
  PROVIDER_ROLE_LABELS,
} from "@/lib/api/providersClient";
import { PROVIDER_ROLES, type ProviderRole } from "@/types/provider";
import { useState } from "react";
import toast from "react-hot-toast";

interface ProviderManualFormProps {
  onCreated: () => void;
  onCancel: () => void;
}

const ProviderManualForm = ({ onCreated, onCancel }: ProviderManualFormProps) => {
  const [displayName, setDisplayName] = useState("");
  const [aliases, setAliases] = useState("");
  const [roles, setRoles] = useState<ProviderRole[]>(["postpartum_doula"]);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleRole = (role: ProviderRole) => {
    setRoles((current) =>
      current.includes(role)
        ? current.filter((item) => item !== role)
        : [...current, role]
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await createAdminProvider({
        displayName: displayName.trim(),
        aliases: aliases
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        roles: roles.length ? roles : ["postpartum_doula"],
        email: email.trim(),
        phone: phone.trim(),
        defaultHourlyRateCents: hourlyRate
          ? Math.round(Number(hourlyRate) * 100)
          : null,
        notes: notes.trim(),
      });
      toast.success("Provider added");
      onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add provider");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="rounded-2xl border border-nurture-sage/25 bg-white p-5 shadow-sm space-y-4"
    >
      <h2 className="font-serif text-lg font-semibold text-nurture-charcoal">
        Add provider
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-nurture-charcoal">Display name</span>
          <input
            required
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
            placeholder="Paula"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-nurture-charcoal">Aliases (comma-separated)</span>
          <input
            value={aliases}
            onChange={(event) => setAliases(event.target.value)}
            className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
            placeholder="LZ/LL, Laura L"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-nurture-charcoal">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-nurture-charcoal">Phone</span>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-nurture-charcoal">Default hourly rate ($)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={hourlyRate}
            onChange={(event) => setHourlyRate(event.target.value)}
            className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
          />
        </label>
      </div>
      <fieldset>
        <legend className="text-sm font-medium text-nurture-charcoal">Roles</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {PROVIDER_ROLES.map((role) => (
            <label
              key={role}
              className="inline-flex items-center gap-2 rounded-full border border-nurture-sage/30 px-3 py-1.5 text-sm"
            >
              <input
                type="checkbox"
                checked={roles.includes(role)}
                onChange={() => toggleRole(role)}
              />
              {PROVIDER_ROLE_LABELS[role]}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block text-sm">
        <span className="font-medium text-nurture-charcoal">Notes</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-nurture-sage px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save provider"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-nurture-sage/30 px-4 py-2 text-sm font-medium text-nurture-sage-dark"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ProviderManualForm;
