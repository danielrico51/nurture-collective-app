"use client";

import {
  POOL_ATTRIBUTE_LABELS,
  POOL_REQUIRED_ATTRIBUTE_NAMES,
  type PoolRequiredAttributeName,
} from "@/lib/auth/poolAttributes";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useEffect, useMemo, useState } from "react";

const inputClassName =
  "mt-1.5 w-full rounded-xl border border-nurture-sage/30 px-4 py-2.5 text-sm focus:border-nurture-sage focus:outline-none focus:ring-2 focus:ring-nurture-sage/30";

const resolveUsername = (username?: string | null) => {
  if (username) return username;
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("nurture_pending_sign_in_username");
};

/**
 * Fields for Cognito NEW_PASSWORD_REQUIRED inside the Authenticator form.
 * Shows password always; shows other inputs only when the profile is missing
 * required Cognito attributes (e.g. address on admin-created accounts).
 */
export function ForceNewPasswordFormFields() {
  const { username } = useAuthenticator((context) => [context.username]);
  const resolvedUsername = resolveUsername(username);
  const [existing, setExisting] = useState<Record<string, string>>({});
  const [missing, setMissing] = useState<PoolRequiredAttributeName[]>([]);
  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!resolvedUsername) {
      setLoading(false);
      setError("Could not determine account username.");
      return;
    }

    fetch(
      `/api/auth/user-profile?username=${encodeURIComponent(resolvedUsername)}`
    )
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(
            typeof data.error === "string"
              ? data.error
              : "Could not load profile"
          );
        }
        setExisting(data.attributes ?? {});
        setMissing(data.missing ?? []);
      })
      .catch(() => {
        setExisting({});
        setMissing(
          POOL_REQUIRED_ATTRIBUTE_NAMES.filter(
            (field) => field !== "custom:username" && field !== "email"
          )
        );
      })
      .finally(() => setLoading(false));
  }, [resolvedUsername]);

  const visibleMissing = useMemo(
    () =>
      missing.filter(
        (field) =>
          field !== "name" ||
          (!missing.includes("given_name") && !missing.includes("family_name"))
      ),
    [missing]
  );

  const needsNameFromParts =
    missing.includes("given_name") && missing.includes("family_name");
  const derivedName = [givenName, familyName].filter(Boolean).join(" ").trim();

  if (loading) {
    return (
      <p className="py-2 text-sm text-nurture-charcoal/60">
        Preparing password form…
      </p>
    );
  }

  if (error) {
    return <p className="py-2 text-sm text-red-600">{error}</p>;
  }

  return (
    <>
      {visibleMissing.length > 0 ? (
        <p className="text-sm text-nurture-charcoal/70">
          Your account is missing a few required details. Fill them in once, then
          set your new password.
        </p>
      ) : null}

      {Object.entries(existing).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} readOnly />
      ))}

      {visibleMissing.map((field) => {
        if (needsNameFromParts && field === "given_name") {
          return (
            <div key={field}>
              <label htmlFor={field} className="block text-sm font-medium">
                {POOL_ATTRIBUTE_LABELS[field]}
              </label>
              <input
                id={field}
                name={field}
                type="text"
                required
                value={givenName}
                onChange={(e) => setGivenName(e.target.value)}
                className={inputClassName}
                placeholder={POOL_ATTRIBUTE_LABELS[field]}
              />
            </div>
          );
        }
        if (needsNameFromParts && field === "family_name") {
          return (
            <div key={field}>
              <label htmlFor={field} className="block text-sm font-medium">
                {POOL_ATTRIBUTE_LABELS[field]}
              </label>
              <input
                id={field}
                name={field}
                type="text"
                required
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                className={inputClassName}
                placeholder={POOL_ATTRIBUTE_LABELS[field]}
              />
            </div>
          );
        }
        return (
          <div key={field}>
            <label htmlFor={field} className="block text-sm font-medium">
              {POOL_ATTRIBUTE_LABELS[field]}
            </label>
            <input
              id={field}
              name={field}
              type={field === "email" ? "email" : "text"}
              required
              className={inputClassName}
              placeholder={POOL_ATTRIBUTE_LABELS[field]}
            />
          </div>
        );
      })}

      {needsNameFromParts && derivedName ? (
        <input type="hidden" name="name" value={derivedName} readOnly />
      ) : null}

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          className={inputClassName}
          placeholder="Enter your new password"
        />
      </div>
      <div>
        <label htmlFor="confirm_password" className="block text-sm font-medium">
          Confirm password
        </label>
        <input
          id="confirm_password"
          name="confirm_password"
          type="password"
          required
          autoComplete="new-password"
          className={inputClassName}
          placeholder="Confirm your new password"
        />
      </div>
    </>
  );
}
