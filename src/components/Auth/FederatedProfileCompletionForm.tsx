"use client";

import { resolvePostAuthPath } from "@/lib/auth/postAuthNavigation";
import {
  FEDERATED_PLACEHOLDER_ADDRESS,
  isPlaceholderAddress,
  isPlaceholderPhone,
  needsFederatedProfileCompletion,
} from "@/lib/auth/federatedProfile";
import {
  formatCognitoPhoneAttribute,
  formatPhoneInputForAmplify,
  resolveCognitoUsername,
  splitPhoneForAmplifyForm,
} from "@/utils/signUpAttributes";
import { loadProfileAttributes } from "@/lib/auth/loadProfileAttributes";
import { saveProfileAttributes } from "@/lib/auth/saveProfileAttributes";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const inputClassName =
  "mt-1.5 w-full rounded-xl border border-nurture-sage/30 px-4 py-2.5 text-sm focus:border-nurture-sage focus:outline-none focus:ring-2 focus:ring-nurture-sage/30";

type FederatedProfileCompletionFormProps = {
  returnTo?: string | null;
};

export function FederatedProfileCompletionForm({
  returnTo = null,
}: FederatedProfileCompletionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [address, setAddress] = useState("");
  const [showUsername, setShowUsername] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [showAddress, setShowAddress] = useState(false);

  useEffect(() => {
    loadProfileAttributes()
      .then((attributes) => {
        if (!needsFederatedProfileCompletion(attributes)) {
          void resolvePostAuthPath(returnTo).then((path) => router.replace(path));
          return;
        }

        const customUsername = attributes["custom:username"]?.trim() ?? "";
        setUsername(customUsername);
        setShowUsername(customUsername.length < 3);

        const phone = attributes.phone_number ?? "";
        const splitPhone = splitPhoneForAmplifyForm(
          isPlaceholderPhone(phone) ? "" : phone
        );
        setPhoneLocal(splitPhone.phone_number);
        setShowPhone(isPlaceholderPhone(phone));

        const addr = attributes.address ?? "";
        const email = attributes.email ?? "";
        setAddress(isPlaceholderAddress(addr, email) ? "" : addr);
        setShowAddress(isPlaceholderAddress(addr, email));
      })
      .catch(() => setError("Could not load your profile. Try signing in again."))
      .finally(() => setLoading(false));
  }, [returnTo, router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const userAttributes: Record<string, string> = {};

      if (showPhone) {
        userAttributes.phone_number = formatCognitoPhoneAttribute(
          phoneLocal.startsWith("+") ? phoneLocal : `+1${phoneLocal}`
        );
      }

      if (showAddress) {
        const trimmed = address.trim();
        if (!trimmed || trimmed === FEDERATED_PLACEHOLDER_ADDRESS) {
          throw new Error("Address is required");
        }
        userAttributes.address = trimmed;
      }

      if (showUsername) {
        userAttributes["custom:username"] = resolveCognitoUsername({
          "custom:username": username,
        });
      }

      if (Object.keys(userAttributes).length === 0) {
        const path = await resolvePostAuthPath(returnTo);
        router.replace(path);
        return;
      }

      await saveProfileAttributes(userAttributes);
      const path = await resolvePostAuthPath(returnTo);
      router.replace(path);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not save your profile"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-center text-nurture-charcoal/65">Loading…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-nurture-charcoal/70">
        Google sign-in does not share your phone or mailing address. Add them
        below to finish creating your account.
      </p>

      {showUsername ? (
        <div>
          <label htmlFor="username" className="block text-sm font-medium">
            Username
          </label>
          <input
            id="username"
            name="username"
            required
            minLength={3}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className={inputClassName}
            placeholder="Choose a username"
            autoComplete="username"
          />
        </div>
      ) : null}

      {showPhone ? (
        <div>
          <label htmlFor="phone_number" className="block text-sm font-medium">
            Phone
          </label>
          <div className="mt-1.5 flex gap-2">
            <span className="inline-flex items-center rounded-xl border border-nurture-sage/30 bg-nurture-cream/50 px-3 text-sm text-nurture-charcoal/70">
              +1
            </span>
            <input
              id="phone_number"
              name="phone_number"
              required
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              value={phoneLocal}
              onChange={(event) =>
                setPhoneLocal(formatPhoneInputForAmplify(event.target.value))
              }
              className={inputClassName}
              placeholder="2626139986"
            />
          </div>
          <p className="mt-1 text-xs text-nurture-charcoal/55">
            US number only — 10 digits without the +1 country code.
          </p>
        </div>
      ) : null}

      {showAddress ? (
        <div>
          <label htmlFor="address" className="block text-sm font-medium">
            Address
          </label>
          <input
            id="address"
            name="address"
            required
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            className={inputClassName}
            placeholder="City, state or full mailing address"
            autoComplete="street-address"
          />
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-nurture-sage px-4 py-3 text-sm font-medium text-white transition hover:bg-nurture-sage/90 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}
