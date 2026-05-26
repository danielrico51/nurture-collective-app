"use client";

import {
  buildCareStartHref,
  CARE_START_PATH,
} from "@/config/carePaths";
import {
  buildBookingUrlWithPrefill,
  getBookingProviderLabel,
  hasBooking,
} from "@/config/bookings";
import {
  buildWhatsAppUrl,
  hasWhatsApp,
} from "@/config/integrations";
import Link from "next/link";

interface ContactOptionsProps {
  /** When set, links to an on-page anchor (e.g. on /contact). */
  formAnchorId?: string;
  /** When set, links to a full path (e.g. /contact#contact-form from other pages). */
  formHref?: string;
  /** Prefilled WhatsApp message. */
  whatsappMessage?: string;
  className?: string;
  /** Intake mode leads with the guided support journey; contact mode uses the legacy form. */
  variant?: "contact" | "intake";
  /** Override intake entry URL (defaults to /care/start). */
  intakeHref?: string;
}

const cardClassName =
  "flex flex-col rounded-2xl border border-nurture-sage/15 bg-white p-8 shadow-sm";

const ContactOptions = ({
  formAnchorId = "contact-form",
  formHref,
  whatsappMessage = "Hi! I'd like to learn more about The Nurture Collective.",
  className = "",
  variant = "contact",
  intakeHref = CARE_START_PATH,
}: ContactOptionsProps) => {
  const whatsappUrl = buildWhatsAppUrl(whatsappMessage);
  const showWhatsApp = hasWhatsApp() && whatsappUrl;
  const showBooking = hasBooking();
  const bookingUrl = buildBookingUrlWithPrefill();
  const bookingLabel = getBookingProviderLabel();
  const isIntake = variant === "intake";

  return (
    <div className={className}>
      <div
        className="grid gap-6 md:grid-cols-3"
        aria-label={isIntake ? "Ways to start support" : "Contact options"}
      >
        <article className={cardClassName}>
          <p className="text-xs font-semibold uppercase tracking-wide text-nurture-sage-dark">
            {isIntake ? "Guided intake" : "Email"}
          </p>
          <h3 className="mt-3 font-serif text-xl font-semibold text-nurture-charcoal">
            {isIntake ? "Start your support journey" : "Send a message"}
          </h3>
          <p className="mt-3 flex-1 text-sm text-nurture-charcoal/70">
            {isIntake
              ? "Answer a few gentle questions so we can personalize support for your stage of motherhood."
              : "Tell us about your needs and we'll respond within one business day."}
          </p>
          <Link
            href={isIntake ? intakeHref : (formHref ?? `#${formAnchorId}`)}
            className="mt-6 inline-block rounded-full bg-nurture-sage px-6 py-2.5 text-sm font-semibold text-white hover:bg-nurture-sage-dark"
          >
            {isIntake ? "Request support" : "Use contact form"}
          </Link>
        </article>

        <article className={cardClassName}>
          <p className="text-xs font-semibold uppercase tracking-wide text-nurture-sage-dark">
            WhatsApp
          </p>
          <h3 className="mt-3 font-serif text-xl font-semibold text-nurture-charcoal">
            Chat with us
          </h3>
          <p className="mt-3 flex-1 text-sm text-nurture-charcoal/70">
            Message our team directly — great for quick questions or scheduling
            updates.
          </p>
          {showWhatsApp ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block rounded-full border border-nurture-sage px-6 py-2.5 text-sm font-semibold text-nurture-sage-dark hover:bg-nurture-sage/10"
            >
              Open WhatsApp
            </a>
          ) : (
            <p className="mt-6 text-sm text-nurture-charcoal/50">
              WhatsApp coming soon
            </p>
          )}
        </article>

        <article className={cardClassName}>
          <p className="text-xs font-semibold uppercase tracking-wide text-nurture-sage-dark">
            {bookingLabel}
          </p>
          <h3 className="mt-3 font-serif text-xl font-semibold text-nurture-charcoal">
            Book a call
          </h3>
          <p className="mt-3 flex-1 text-sm text-nurture-charcoal/70">
            Schedule a free discovery call at a time that works for you.
          </p>
          {showBooking && bookingUrl ? (
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block rounded-full border border-nurture-sage px-6 py-2.5 text-sm font-semibold text-nurture-sage-dark hover:bg-nurture-sage/10"
            >
              Schedule now
            </a>
          ) : (
            <Link
              href={isIntake ? buildCareStartHref() : "/contact"}
              className="mt-6 inline-block rounded-full border border-nurture-sage px-6 py-2.5 text-sm font-semibold text-nurture-sage-dark hover:bg-nurture-sage/10"
            >
              {isIntake ? "Request support" : "Request a call"}
            </Link>
          )}
        </article>
      </div>

      {isIntake ? (
        <p className="mt-6 text-center text-sm text-nurture-charcoal/55">
          Prefer email?{" "}
          <Link
            href="/contact?audience=mom"
            className="font-medium text-nurture-sage-dark hover:underline"
          >
            Use our contact form
          </Link>
        </p>
      ) : null}
    </div>
  );
};

export default ContactOptions;
