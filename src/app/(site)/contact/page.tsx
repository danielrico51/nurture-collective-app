"use client";

import Breadcrumb from "@/components/Common/Breadcrumb";
import ContactOptions from "@/components/Common/ContactOptions";
import SectionTitle from "@/components/Common/SectionTitle";
import { integrations } from "@/config/integrations";
import type { Audience } from "@/content/site";
import {
  PREFERRED_CONTACT_OPTIONS,
  PROVIDER_SPECIALTY_SLUGS,
  SERVICE_SLUGS,
  audienceLabels,
  isAudience,
} from "@/types/inquiry";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import toast from "react-hot-toast";

const inputClassName =
  "mt-2 w-full rounded-lg border border-nurture-sage/30 px-4 py-2.5 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage";

function ContactForm() {
  const searchParams = useSearchParams();
  const audienceParam = searchParams.get("audience");
  const initialAudience: Audience = isAudience(audienceParam)
    ? audienceParam
    : "mom";
  const serviceParam = searchParams.get("service") ?? "";
  const specialtyParam = searchParams.get("specialty") ?? "";
  const serviceLabel = SERVICE_SLUGS[serviceParam] ?? "";
  const specialtyLabel = PROVIDER_SPECIALTY_SLUGS[specialtyParam] ?? "";

  const [audience, setAudience] = useState<Audience>(initialAudience);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audience: String(data.get("audience") ?? "mom"),
          name: String(data.get("name") ?? ""),
          email: String(data.get("email") ?? ""),
          phone: String(data.get("phone") ?? "") || undefined,
          message: String(data.get("message") ?? ""),
          preferredContact: String(data.get("preferredContact") ?? "email"),
          serviceInterest:
            audience === "mom"
              ? String(data.get("serviceInterest") ?? "") || undefined
              : undefined,
          providerSpecialty:
            audience === "provider"
              ? String(data.get("providerSpecialty") ?? "") || undefined
              : undefined,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Could not send message");
      }

      toast.success(
        audience === "provider"
          ? "Application received — our team will review and follow up."
          : "Message sent — we'll be in touch soon."
      );
      setSubmitted(true);
      form.reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not send message"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      id="contact-form"
      onSubmit={handleSubmit}
      className="mt-10 space-y-6 rounded-2xl border border-nurture-sage/15 bg-white p-8 shadow-sm"
    >
      <div>
        <p className="text-sm font-medium text-nurture-charcoal">I am…</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {(["mom", "provider"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setAudience(value)}
              className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                audience === value
                  ? "border-nurture-sage bg-nurture-sage/10 text-nurture-sage-dark"
                  : "border-nurture-sage/25 text-nurture-charcoal/70 hover:border-nurture-sage/40"
              }`}
            >
              {audienceLabels[value]}
            </button>
          ))}
        </div>
        <input type="hidden" name="audience" value={audience} />
      </div>

      {serviceLabel && audience === "mom" ? (
        <p className="rounded-lg bg-nurture-cream/80 px-4 py-3 text-sm text-nurture-charcoal/80">
          Interested in:{" "}
          <span className="font-medium text-nurture-sage-dark">{serviceLabel}</span>
        </p>
      ) : null}

      {specialtyLabel && audience === "provider" ? (
        <p className="rounded-lg bg-nurture-cream/80 px-4 py-3 text-sm text-nurture-charcoal/80">
          Applying as:{" "}
          <span className="font-medium text-nurture-sage-dark">{specialtyLabel}</span>
        </p>
      ) : null}

      {submitted ? (
        <p className="rounded-lg bg-nurture-sage/10 px-4 py-3 text-sm text-nurture-sage-dark">
          Thank you! We typically respond within one business day.
        </p>
      ) : null}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-nurture-charcoal">
          Name
        </label>
        <input id="name" name="name" type="text" required className={inputClassName} />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-nurture-charcoal">
          Email
        </label>
        <input id="email" name="email" type="email" required className={inputClassName} />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-nurture-charcoal">
          Phone{" "}
          <span className="font-normal text-nurture-charcoal/50">
            ({audience === "provider" ? "required for providers" : "recommended"})
          </span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required={audience === "provider"}
          placeholder="+12065550100"
          className={inputClassName}
        />
      </div>
      <div>
        <label htmlFor="preferredContact" className="block text-sm font-medium text-nurture-charcoal">
          Preferred contact method
        </label>
        <select
          id="preferredContact"
          name="preferredContact"
          defaultValue="email"
          className={inputClassName}
        >
          {PREFERRED_CONTACT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {audience === "mom" ? (
        serviceLabel ? (
          <input type="hidden" name="serviceInterest" value={serviceParam} />
        ) : (
          <div>
            <label htmlFor="serviceInterest" className="block text-sm font-medium text-nurture-charcoal">
              Service interest
            </label>
            <select
              id="serviceInterest"
              name="serviceInterest"
              defaultValue=""
              className={inputClassName}
            >
              <option value="">Not sure yet</option>
              {Object.entries(SERVICE_SLUGS).map(([slug, label]) => (
                <option key={slug} value={slug}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )
      ) : specialtyLabel ? (
        <input type="hidden" name="providerSpecialty" value={specialtyParam} />
      ) : (
        <div>
          <label htmlFor="providerSpecialty" className="block text-sm font-medium text-nurture-charcoal">
            Your specialty
          </label>
          <select
            id="providerSpecialty"
            name="providerSpecialty"
            defaultValue=""
            required
            className={inputClassName}
          >
            <option value="">Select your specialty</option>
            {Object.entries(PROVIDER_SPECIALTY_SLUGS).map(([slug, label]) => (
              <option key={slug} value={slug}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-nurture-charcoal">
          {audience === "provider" ? "Tell us about your experience" : "Message"}
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          placeholder={
            audience === "provider"
              ? "Credentials, years of experience, service area, and why you'd like to join…"
              : "How can we support you?"
          }
          className={inputClassName}
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-nurture-sage py-3 text-sm font-semibold text-white hover:bg-nurture-sage-dark disabled:opacity-60"
      >
        {submitting
          ? "Sending…"
          : audience === "provider"
            ? "Submit application"
            : "Send message"}
      </button>
      <p className="text-center text-xs text-nurture-charcoal/50">
        Or email us at{" "}
        <a
          href={`mailto:${integrations.contactEmail}`}
          className="text-nurture-sage-dark hover:underline"
        >
          {integrations.contactEmail}
        </a>
        .{" "}
        {audience === "provider" ? (
          <>
            Prefer the full provider page?{" "}
            <Link href="/for-providers" className="text-nurture-sage-dark hover:underline">
              Learn more
            </Link>
            .
          </>
        ) : (
          "We respond within one business day."
        )}
      </p>
    </form>
  );
}

export default function ContactPage() {
  return (
    <>
      <Breadcrumb pageName="Contact" />
      <section className="py-16">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="Let's connect"
            subtitle="Families seeking support and providers joining our network — we're here for both."
          />
          <ContactOptions className="mt-10" formAnchorId="contact-form" />
          <div className="mx-auto mt-16 max-w-xl">
            <h2 className="font-serif text-2xl font-semibold text-nurture-charcoal">
              Send a message
            </h2>
            <Suspense
              fallback={
                <p className="mt-6 text-sm text-nurture-charcoal/60">Loading form…</p>
              }
            >
              <ContactForm />
            </Suspense>
          </div>
        </div>
      </section>
    </>
  );
}
