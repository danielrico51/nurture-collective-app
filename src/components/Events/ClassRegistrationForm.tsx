"use client";

import {
  classRegistrationCheckoutConfig,
} from "@/config/classRegistrations";
import { readStoredRegistrationSource } from "@/lib/classRegistrations/attribution";
import { registerForEvent } from "@/lib/api/classRegistrationsClient";
import { trackFormSubmission } from "@/lib/analytics/track";
import { formatEventPrice } from "@/lib/events/format";
import type {
  ClassAvailability,
  ClassRegistrationPaymentInfo,
  ClassRegistrationPaymentMethod,
} from "@/types/classRegistration";
import type { EventItem } from "@/types/event";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";

interface ClassRegistrationFormProps {
  event: EventItem;
  availability: ClassAvailability;
}

const ClassRegistrationForm = ({
  event,
  availability,
}: ClassRegistrationFormProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<ClassRegistrationPaymentMethod | null>(null);
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [waitlisted, setWaitlisted] = useState(false);
  const [paymentInfo, setPaymentInfo] =
    useState<ClassRegistrationPaymentInfo | null>(null);

  const priceLabel = formatEventPrice(event.priceCents);
  const feeCents = event.priceCents ?? 0;
  const joiningWaitlist =
    availability.spotsRemaining === 0 && availability.waitlistEnabled;
  const paymentDue = feeCents > 0 && !joiningWaitlist;
  const stripeAvailable =
    classRegistrationCheckoutConfig.stripeEnabled &&
    classRegistrationCheckoutConfig.paymentsEnabled;
  const venmoAvailable = Boolean(classRegistrationCheckoutConfig.venmoHandle);
  const showPaymentChoice = paymentDue && (stripeAvailable || venmoAvailable);

  const handleSubmit = async (submitEvent: React.FormEvent) => {
    submitEvent.preventDefault();
    setSaving(true);
    try {
      const { registration, payment } = await registerForEvent(event.slug, {
        registrantName: name.trim(),
        registrantEmail: email.trim(),
        registrantPhone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
        paymentMethod: showPaymentChoice && paymentMethod ? paymentMethod : undefined,
        source: readStoredRegistrationSource() ?? "website",
      });

      if (payment?.checkoutUrl) {
        trackFormSubmission({
          formName: "class_registration",
          eventSlug: event.slug,
        });
        window.location.href = payment.checkoutUrl;
        return;
      }

      trackFormSubmission({
        formName: "class_registration",
        eventSlug: event.slug,
      });
      setWaitlisted(registration.status === "waitlisted");
      setPaymentInfo(payment ?? null);
      setCompleted(true);
      toast.success(
        registration.status === "waitlisted"
          ? "Added to the waitlist"
          : payment?.method === "venmo"
            ? "Registration saved — complete Venmo payment"
            : "Registration received"
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not complete registration"
      );
    } finally {
      setSaving(false);
    }
  };

  if (completed) {
    return (
      <div className="rounded-2xl border border-nurture-sage/20 bg-nurture-cream/40 p-6">
        <h2 className="font-serif text-2xl font-semibold text-nurture-charcoal">
          {waitlisted
            ? "You're on the waitlist"
            : paymentInfo?.method === "venmo"
              ? "Almost done — send Venmo payment"
              : "You're registered"}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-nurture-charcoal/75">
          {waitlisted
            ? "We'll reach out if a spot opens for this class. Check your inbox for a waitlist confirmation email."
            : paymentInfo?.method === "venmo"
              ? paymentInfo.message
              : "Your registration is saved. Check your inbox for a confirmation email with class details."}
        </p>

        {paymentInfo?.method === "venmo" && paymentInfo.venmoUrl ? (
          <div className="mt-5 space-y-3 rounded-xl border border-nurture-sage/20 bg-white p-4">
            <p className="text-sm text-nurture-charcoal/75">
              Pay {priceLabel} to{" "}
              <strong>@{paymentInfo.venmoHandle?.replace(/^@/, "")}</strong> and
              include the class name in the note so we can match your payment.
            </p>
            {paymentInfo.venmoProfileUrl ? (
              <p className="text-sm text-nurture-charcoal/75">
                Find us on Venmo:{" "}
                <a
                  href={paymentInfo.venmoProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-nurture-sage-dark underline"
                >
                  {paymentInfo.venmoProfileUrl}
                </a>
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3">
              {paymentInfo.venmoProfileUrl ? (
                <a
                  href={paymentInfo.venmoProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex rounded-full border border-[#008CFF] px-5 py-2 text-sm font-semibold text-[#008CFF] hover:bg-[#008CFF]/5"
                >
                  Open Venmo profile
                </a>
              ) : null}
              <a
                href={paymentInfo.venmoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-full bg-[#008CFF] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0075d6]"
              >
                Pay in Venmo
              </a>
            </div>
            <p className="text-xs text-nurture-charcoal/60">
              Your spot is held while payment is pending. Our team will confirm once
              Venmo is received.
            </p>
          </div>
        ) : null}

        <Link
          href={`/events-and-classes/${event.slug}`}
          className="mt-5 inline-flex rounded-full bg-nurture-sage px-5 py-2 text-sm font-semibold text-white hover:bg-nurture-sage-dark"
        >
          Back to class details
        </Link>
      </div>
    );
  }

  if (!availability.registrationOpen) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        Registration is currently closed for this class.
        {" "}
        <Link href="/contact" className="font-semibold underline">
          Contact us
        </Link>{" "}
        if you need help.
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-nurture-sage/20 bg-white p-6 shadow-sm"
    >
      <h2 className="font-serif text-2xl font-semibold text-nurture-charcoal">
        Register online
      </h2>
      <p className="mt-2 text-sm text-nurture-charcoal/70">
        {availability.spotsRemaining === null
          ? "Spots are available."
          : availability.spotsRemaining > 0
            ? `${availability.spotsRemaining} spot${availability.spotsRemaining === 1 ? "" : "s"} remaining.`
            : availability.waitlistEnabled
              ? "This class is full — submit the form to join the waitlist."
              : "This class is full."}
        {priceLabel ? ` Fee: ${priceLabel}.` : ""}
      </p>

      <div className="mt-6 grid gap-4">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
            Full name *
          </span>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
            Email *
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
            Phone
          </span>
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
            Notes
          </span>
          <textarea
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Due date, questions, or anything we should know…"
            className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm"
          />
        </label>

        {paymentDue && !showPaymentChoice && process.env.NODE_ENV === "development" ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            This class has a fee, but payment methods are not enabled locally. Add{" "}
            <span className="font-mono text-xs">
              NEXT_PUBLIC_CLASS_REGISTRATION_VENMO_HANDLE
            </span>{" "}
            or Stripe vars in <span className="font-mono text-xs">.env.local</span>,
            then restart the dev server.
          </p>
        ) : null}

        {showPaymentChoice ? (
          <fieldset className="rounded-xl border border-nurture-sage/20 p-4">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
              Payment (optional)
            </legend>
            <p className="mt-1 text-xs text-nurture-charcoal/55">
              Choose how you&apos;d like to pay, or register now and we&apos;ll follow up
              about payment.
            </p>
            <div className="mt-3 space-y-2">
              {stripeAvailable ? (
                <label className="flex items-center gap-2 text-sm text-nurture-charcoal/80">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="stripe"
                    checked={paymentMethod === "stripe"}
                    onChange={() => setPaymentMethod("stripe")}
                  />
                  Pay with card (Stripe)
                </label>
              ) : null}
              {venmoAvailable ? (
                <label className="flex items-center gap-2 text-sm text-nurture-charcoal/80">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="venmo"
                    checked={paymentMethod === "venmo"}
                    onChange={() => setPaymentMethod("venmo")}
                  />
                  Pay with Venmo (@
                  {classRegistrationCheckoutConfig.venmoHandle.replace(/^@/, "")})
                </label>
              ) : null}
              <label className="flex items-center gap-2 text-sm text-nurture-charcoal/80">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="later"
                  checked={paymentMethod === null}
                  onChange={() => setPaymentMethod(null)}
                />
                Register now — pay later
              </label>
            </div>
          </fieldset>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={saving}
        className="mt-6 rounded-full bg-nurture-sage px-6 py-2.5 text-sm font-semibold text-white hover:bg-nurture-sage-dark disabled:opacity-60"
      >
        {saving
          ? "Submitting…"
          : joiningWaitlist
            ? "Join waitlist"
            : showPaymentChoice && paymentMethod === "stripe"
              ? "Continue to payment"
              : "Submit registration"}
      </button>
    </form>
  );
};

export default ClassRegistrationForm;
