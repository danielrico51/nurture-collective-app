"use client";

import Breadcrumb from "@/components/Common/Breadcrumb";
import { PREFERRED_CONTACT_OPTIONS, SERVICE_SLUGS } from "@/types/inquiry";
import { attributesToProfileForm } from "@/lib/auth/profileAttributes";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { fetchUserAttributes } from "aws-amplify/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";

const inputClassName =
  "mt-2 w-full rounded-lg border border-nurture-sage/30 px-4 py-2.5 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage";

const IntakePage = () => {
  const router = useRouter();
  const { authStatus, user } = useAuthenticator((context) => [
    context.authStatus,
    context.user,
  ]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const [defaults, setDefaults] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/signin");
      return;
    }
    if (authStatus !== "authenticated") return;

    fetchUserAttributes()
      .then((attributes) => {
        const form = attributesToProfileForm(attributes);
        const name = [form.givenName, form.familyName].filter(Boolean).join(" ");
        setDefaults({
          name,
          email: form.email || user?.signInDetails?.loginId || "",
          phone: form.phoneNumber,
        });
        setProfileReady(Boolean(form.phoneNumber.trim()));
      })
      .catch(() => {
        setDefaults({
          name: "",
          email: user?.signInDetails?.loginId ?? "",
          phone: "",
        });
      })
      .finally(() => setLoading(false));
  }, [authStatus, router, user]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const form = e.currentTarget;
    const data = new FormData(form);
    const phone = String(data.get("phone") ?? "").trim();

    if (!phone) {
      toast.error("Please add your phone number before submitting intake.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "member-intake",
          audience: "mom",
          userId: user?.userId,
          name: String(data.get("name") ?? ""),
          email: String(data.get("email") ?? ""),
          phone,
          message: String(data.get("message") ?? ""),
          preferredContact: String(data.get("preferredContact") ?? "email"),
          serviceInterest: String(data.get("serviceInterest") ?? "") || undefined,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Could not submit intake");
      }

      toast.success("Intake submitted — your coordinator will be in touch soon.");
      router.push("/dashboard");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not submit intake"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (authStatus !== "authenticated" || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-nurture-charcoal/60">Loading intake form…</p>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb pageName="Member intake" />
      <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl">
          <h2 className="font-serif text-2xl font-semibold text-nurture-charcoal">
            Tell us about your journey
          </h2>
          <p className="mt-3 text-nurture-charcoal/70">
            This helps your concierge coordinator prepare personalized support.
            Please ensure your profile phone number is up to date.
          </p>

          {!profileReady ? (
            <div className="mt-6 rounded-xl border border-nurture-blush/40 bg-nurture-cream/50 p-4 text-sm text-nurture-charcoal/80">
              Add your phone number to your{" "}
              <Link
                href="/account/profile"
                className="font-medium text-nurture-sage-dark hover:underline"
              >
                profile
              </Link>{" "}
              so we can reach you via WhatsApp or SMS.
            </div>
          ) : null}

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-6 rounded-2xl border border-nurture-sage/15 bg-white p-8 shadow-sm"
          >
            <div>
              <label htmlFor="name" className="block text-sm font-medium">
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={defaults.name}
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                readOnly
                defaultValue={defaults.email}
                className="mt-2 w-full rounded-lg border border-nurture-sage/15 bg-nurture-cream/60 px-4 py-2.5 text-sm text-nurture-charcoal/70"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium">
                Phone <span className="text-red-600">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                defaultValue={defaults.phone}
                placeholder="+12065550100"
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="serviceInterest" className="block text-sm font-medium">
                Primary service interest
              </label>
              <select
                id="serviceInterest"
                name="serviceInterest"
                defaultValue=""
                className={inputClassName}
              >
                <option value="">Select a service</option>
                {Object.entries(SERVICE_SLUGS).map(([slug, label]) => (
                  <option key={slug} value={slug}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="preferredContact" className="block text-sm font-medium">
                Preferred contact method
              </label>
              <select
                id="preferredContact"
                name="preferredContact"
                defaultValue="whatsapp"
                className={inputClassName}
              >
                {PREFERRED_CONTACT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium">
                Tell us about your needs
              </label>
              <textarea
                id="message"
                name="message"
                rows={6}
                required
                placeholder="Where are you in your journey? What support would be most helpful?"
                className={inputClassName}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-nurture-sage py-3 text-sm font-semibold text-white hover:bg-nurture-sage-dark disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit intake"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default IntakePage;
