"use client";

import {
  attributesToProfileForm,
  profileFormToUserAttributes,
} from "@/lib/auth/profileAttributes";
import { loadProfileAttributes } from "@/lib/auth/loadProfileAttributes";
import { formatCognitoPhoneAttribute } from "@/utils/signUpAttributes";
import type { ProfileFormData } from "@/types/profile";
import { emptyProfileForm } from "@/types/profile";
import { saveProfileAttributes } from "@/lib/auth/saveProfileAttributes";
import { ProfileAvatarField } from "@/components/Account/ProfileAvatarField";
import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";

const inputClassName =
  "mt-2 w-full rounded-lg border border-nurture-sage/30 px-4 py-2.5 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage";

const readOnlyClassName =
  "mt-2 w-full rounded-lg border border-nurture-sage/15 bg-nurture-cream/60 px-4 py-2.5 text-sm text-nurture-charcoal/70";

const ProfileForm = () => {
  const [form, setForm] = useState<ProfileFormData>(emptyProfileForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfileAttributes()
      .then((attributes) => setForm(attributesToProfileForm(attributes)))
      .catch((error) =>
        toast.error(
          error instanceof Error ? error.message : "Could not load your profile"
        )
      )
      .finally(() => setLoading(false));
  }, []);

  const updateField = (field: keyof ProfileFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      const phoneNumber = formatCognitoPhoneAttribute(form.phoneNumber);
      if (form.username.trim().length > 0 && form.username.trim().length < 3) {
        throw new Error("Username must be at least 3 characters");
      }

      await saveProfileAttributes(
        profileFormToUserAttributes({
          ...form,
          phoneNumber,
        })
      );

      const fullName = [form.givenName, form.familyName]
        .filter(Boolean)
        .join(" ")
        .trim();
      if (fullName) {
        try {
          const { intakeRequestHeaders } = await import(
            "@/lib/api/intakeRequestHeaders"
          );
          await fetch("/api/community/users/me", {
            method: "PATCH",
            headers: await intakeRequestHeaders(),
            body: JSON.stringify({ display_name: fullName }),
          });
        } catch {
          /* community service optional */
        }
      }

      toast.success("Profile updated");
      const refreshed = await loadProfileAttributes();
      setForm(attributesToProfileForm(refreshed));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save profile"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-nurture-sage/15 bg-white p-8 shadow-sm">
        <p className="text-nurture-charcoal/60">Loading your information…</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-nurture-sage/15 bg-white p-8 shadow-sm md:p-10"
    >
      <ProfileAvatarField
        displayName={[form.givenName, form.familyName].filter(Boolean).join(" ")}
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="username" className="block text-sm font-medium">
            Username
          </label>
          <input
            id="username"
            type="text"
            required
            minLength={3}
            value={form.username}
            onChange={(e) => updateField("username", e.target.value)}
            className={inputClassName}
            placeholder="Your username"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            readOnly
            value={form.email}
            className={readOnlyClassName}
          />
          <p className="mt-1.5 text-xs text-nurture-charcoal/50">
            Email is used to sign in. Contact support to change it.
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="givenName" className="block text-sm font-medium">
            First name
          </label>
          <input
            id="givenName"
            type="text"
            required
            value={form.givenName}
            onChange={(e) => updateField("givenName", e.target.value)}
            className={inputClassName}
          />
        </div>
        <div>
          <label htmlFor="familyName" className="block text-sm font-medium">
            Last name
          </label>
          <input
            id="familyName"
            type="text"
            required
            value={form.familyName}
            onChange={(e) => updateField("familyName", e.target.value)}
            className={inputClassName}
          />
        </div>
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium">
          Address
        </label>
        <input
          id="address"
          type="text"
          required
          value={form.address}
          onChange={(e) => updateField("address", e.target.value)}
          className={inputClassName}
          placeholder="Street, city, state"
        />
      </div>

      <div>
        <label htmlFor="phoneNumber" className="block text-sm font-medium">
          Phone
        </label>
        <input
          id="phoneNumber"
          type="tel"
          required
          value={form.phoneNumber}
          onChange={(e) => updateField("phoneNumber", e.target.value)}
          className={inputClassName}
          placeholder="+12065550100"
        />
        <p className="mt-1.5 text-xs text-nurture-charcoal/50">
          Required for member intake and WhatsApp or SMS contact from your
          concierge coordinator.
        </p>
      </div>

      <div className="flex flex-wrap gap-4 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-nurture-sage px-6 py-3 text-sm font-medium text-white hover:bg-nurture-sage-dark disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
};

export default ProfileForm;
