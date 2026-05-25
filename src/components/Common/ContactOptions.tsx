"use client";

import {
  buildWhatsAppUrl,
  hasCalendly,
  hasWhatsApp,
  integrations,
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
}

const cardClassName =
  "flex flex-col rounded-2xl border border-nurture-sage/15 bg-white p-8 shadow-sm";

const ContactOptions = ({
  formAnchorId = "contact-form",
  formHref,
  whatsappMessage = "Hi! I'd like to learn more about The Nurture Collective.",
  className = "",
}: ContactOptionsProps) => {
  const whatsappUrl = buildWhatsAppUrl(whatsappMessage);
  const showWhatsApp = hasWhatsApp() && whatsappUrl;
  const showCalendly = hasCalendly();

  return (
    <div
      className={`grid gap-6 md:grid-cols-3 ${className}`}
      aria-label="Contact options"
    >
      <article className={cardClassName}>
        <p className="text-xs font-semibold uppercase tracking-wide text-nurture-sage-dark">
          Email
        </p>
        <h3 className="mt-3 font-serif text-xl font-semibold text-nurture-charcoal">
          Send a message
        </h3>
        <p className="mt-3 flex-1 text-sm text-nurture-charcoal/70">
          Tell us about your needs and we&apos;ll respond within one business
          day.
        </p>
        <Link
          href={
            formHref ??
            (formAnchorId.startsWith("#")
              ? formAnchorId
              : `#${formAnchorId}`)
          }
          className="mt-6 inline-block rounded-full bg-nurture-sage px-6 py-2.5 text-sm font-semibold text-white hover:bg-nurture-sage-dark"
        >
          Use contact form
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
          Calendly
        </p>
        <h3 className="mt-3 font-serif text-xl font-semibold text-nurture-charcoal">
          Book a call
        </h3>
        <p className="mt-3 flex-1 text-sm text-nurture-charcoal/70">
          Schedule a free discovery call at a time that works for you.
        </p>
        {showCalendly ? (
          <a
            href={integrations.calendlyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block rounded-full border border-nurture-sage px-6 py-2.5 text-sm font-semibold text-nurture-sage-dark hover:bg-nurture-sage/10"
          >
            Schedule now
          </a>
        ) : (
          <Link
            href="/contact"
            className="mt-6 inline-block rounded-full border border-nurture-sage px-6 py-2.5 text-sm font-semibold text-nurture-sage-dark hover:bg-nurture-sage/10"
          >
            Request a call
          </Link>
        )}
      </article>
    </div>
  );
};

export default ContactOptions;
