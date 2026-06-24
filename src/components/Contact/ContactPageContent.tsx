"use client";

import Breadcrumb from "@/components/Common/Breadcrumb";
import ContactOptions from "@/components/Common/ContactOptions";
import SectionTitle from "@/components/Common/SectionTitle";
import { integrations } from "@/config/integrations";
import { legalPaths } from "@/content/legal";
import { mapContactFormToIntakeSubmit } from "@/lib/intake/mapContactForm";
import { trackFormSubmission } from "@/lib/analytics/track";
import { PREFERRED_CONTACT_OPTIONS, SERVICE_SLUGS } from "@/types/inquiry";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import toast from "react-hot-toast";

const inputClassName =
  "mt-2 w-full rounded-lg border border-nurture-sage/30 px-4 py-2.5 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage";

function ContactForm() {
  const searchParams = useSearchParams();
  const serviceParam = searchParams.get("service") ?? "";
  const serviceLabel = SERVICE_SLUGS[serviceParam] ?? "";

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [preferredContact, setPreferredContact] = useState("email");
  const [smsConsent, setSmsConsent] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting || submitted) return;

    if (!smsConsent) {
      toast.error("Please check the SMS consent box to submit the form.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const form = e.currentTarget;
    const data = new FormData(form);

    const payload = mapContactFormToIntakeSubmit({
      audience: "mom",
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? "") || undefined,
      message: String(data.get("message") ?? ""),
      preferredContact: String(data.get("preferredContact") ?? "email"),
      serviceSlug: String(data.get("serviceInterest") ?? serviceParam) || undefined,
      smsConsent,
    });

    try {
      const response = await fetch("/api/intake/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Could not send message");
      }

      toast.success("Message sent — we'll be in touch soon.");
      trackFormSubmission({
        formName: "contact",
        service: payload.service_requested || undefined,
      });
      setSubmitted(true);
      setSmsConsent(false);
      form.reset();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not send message";
      setSubmitError(message);
      toast.error(message);
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
      {serviceLabel ? (
        <p className="rounded-lg bg-nurture-cream/80 px-4 py-3 text-sm text-nurture-charcoal/80">
          Interested in:{" "}
          <span className="font-medium text-nurture-sage-dark">{serviceLabel}</span>
        </p>
      ) : null}

      {submitted ? (
        <p className="rounded-lg bg-nurture-sage/10 px-4 py-3 text-sm text-nurture-sage-dark">
          Thank you! We typically respond within one business day.
        </p>
      ) : null}

      {submitError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p>{submitError}</p>
          <button
            type="button"
            onClick={() => setSubmitError(null)}
            className="mt-2 font-semibold underline"
          >
            Try again
          </button>
        </div>
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
          <span className="font-normal text-nurture-charcoal/50">(recommended)</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          placeholder="+12065550100"
          className={inputClassName}
        />
      </div>

      <div className="flex items-start gap-3">
        <input
          id="smsConsent"
          name="smsConsent"
          type="checkbox"
          checked={smsConsent}
          onChange={(event) => setSmsConsent(event.target.checked)}
          required
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-nurture-sage/40 text-nurture-sage focus:ring-nurture-sage"
        />
        <label
          htmlFor="smsConsent"
          className="text-sm leading-relaxed text-nurture-charcoal/75"
        >
          By checking this box, I consent to receive SMS text messages from The
          Nesting Place at the phone number provided. Messages may include
          information about my inquiry and care coordination services. Message
          frequency varies. Message & data rates may apply. Reply STOP to
          opt out or HELP for help. See our{" "}
          <Link
            href={legalPaths.privacyPolicy}
            className="font-medium text-nurture-sage-dark underline hover:text-nurture-sage"
          >
            Privacy Policy
          </Link>
          .
        </label>
      </div>

      <div>
        <label htmlFor="preferredContact" className="block text-sm font-medium text-nurture-charcoal">
          Preferred contact method
        </label>
        <select
          id="preferredContact"
          name="preferredContact"
          value={preferredContact}
          onChange={(event) => setPreferredContact(event.target.value)}
          className={inputClassName}
        >
          {PREFERRED_CONTACT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {serviceLabel ? (
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
      )}

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-nurture-charcoal">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          placeholder="How can we support you?"
          className={inputClassName}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-nurture-sage py-3 text-sm font-semibold text-white hover:bg-nurture-sage-dark disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Send message"}
      </button>
      <p className="text-center text-xs text-nurture-charcoal/50">
        Or email us at{" "}
        <a
          href={`mailto:${integrations.contactEmail}`}
          className="text-nurture-sage-dark hover:underline"
        >
          {integrations.contactEmail}
        </a>
        . We respond within one business day.
      </p>
    </form>
  );
}

const ContactPageContent = () => (
  <>
    <Breadcrumb pageName="Contact" />
    <section className="py-16">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title="Let's connect"
          subtitle="Tell us how we can support you — we'll respond within one business day."
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

export default ContactPageContent;
