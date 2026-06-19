"use client";

import {
  PROVIDER_ROLE_LABELS,
  PROVIDER_STATUS_LABELS,
  updateAdminProvider,
} from "@/lib/api/providersClient";
import {
  PROVIDER_ROLES,
  PROVIDER_STATUSES,
  type ProviderRecord,
  type ProviderRole,
  type ProviderStatus,
} from "@/types/provider";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface ProviderDetailPanelProps {
  provider: ProviderRecord;
  onChanged: () => void;
}

const ProviderDetailPanel = ({
  provider,
  onChanged,
}: ProviderDetailPanelProps) => {
  const [displayName, setDisplayName] = useState(provider.displayName);
  const [aliases, setAliases] = useState(provider.aliases.join(", "));
  const [roles, setRoles] = useState<ProviderRole[]>(provider.roles);
  const [email, setEmail] = useState(provider.email);
  const [phone, setPhone] = useState(provider.phone);
  const [hourlyRate, setHourlyRate] = useState(
    provider.defaultHourlyRateCents != null
      ? String(provider.defaultHourlyRateCents / 100)
      : ""
  );
  const [notes, setNotes] = useState(provider.notes);
  const [status, setStatus] = useState<ProviderStatus>(provider.status);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDisplayName(provider.displayName);
    setAliases(provider.aliases.join(", "));
    setRoles(provider.roles);
    setEmail(provider.email);
    setPhone(provider.phone);
    setHourlyRate(
      provider.defaultHourlyRateCents != null
        ? String(provider.defaultHourlyRateCents / 100)
        : ""
    );
    setNotes(provider.notes);
    setStatus(provider.status);
  }, [provider]);

  const toggleRole = (role: ProviderRole) => {
    setRoles((current) =>
      current.includes(role)
        ? current.filter((item) => item !== role)
        : [...current, role]
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateAdminProvider(provider.providerId, {
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
        status,
      });
      toast.success("Provider updated");
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const archive = async () => {
    setSaving(true);
    try {
      await updateAdminProvider(provider.providerId, { archive: true });
      toast.success("Provider archived");
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Archive failed");
    } finally {
      setSaving(false);
    }
  };

  const restore = async () => {
    setSaving(true);
    try {
      await updateAdminProvider(provider.providerId, { restore: true });
      toast.success("Provider restored");
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Restore failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-nurture-charcoal">Display name</span>
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-nurture-charcoal">Status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as ProviderStatus)}
            className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
          >
            {PROVIDER_STATUSES.map((item) => (
              <option key={item} value={item}>
                {PROVIDER_STATUS_LABELS[item]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium text-nurture-charcoal">Aliases</span>
          <input
            value={aliases}
            onChange={(event) => setAliases(event.target.value)}
            className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
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
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="rounded-full bg-nurture-sage px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {provider.archivedAt ? (
          <button
            type="button"
            disabled={saving}
            onClick={() => void restore()}
            className="rounded-full border border-nurture-sage/30 px-4 py-2 text-sm font-medium text-nurture-sage-dark"
          >
            Restore
          </button>
        ) : (
          <button
            type="button"
            disabled={saving}
            onClick={() => void archive()}
            className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-700"
          >
            Archive
          </button>
        )}
      </div>
    </div>
  );
};

export default ProviderDetailPanel;
