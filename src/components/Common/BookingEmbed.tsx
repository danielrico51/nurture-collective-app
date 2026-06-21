"use client";

import {
  BOOKING_ANCHOR_ID,
  buildBookingEmbedUrl,
  getActiveBookingUrl,
  hasBooking,
  LEGACY_CALENDLY_ANCHOR_ID,
} from "@/config/bookings";
import { ScrollRevealHeading } from "@/components/Common/ScrollRevealHeading.client";
import { brands } from "@/content/site";

const defaultBookingSubtitle = `Pick a time that works for you — we'll learn about your needs and answer your questions. Calendar invites come from ${brands.nestingPlace.email}.`;

interface BookingEmbedProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

const BookingEmbed = ({
  title = "Maternal Support Introductory Call",
  subtitle = defaultBookingSubtitle,
  className = "",
}: BookingEmbedProps) => {
  const url = getActiveBookingUrl();
  if (!hasBooking() || !url) return null;

  const embedUrl = buildBookingEmbedUrl(url);

  return (
    <section className={`py-16 ${className}`} id={BOOKING_ANCHOR_ID}>
      <span id={LEGACY_CALENDLY_ANCHOR_ID} className="sr-only" aria-hidden />
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <ScrollRevealHeading
            variant="soft"
            className="font-serif text-3xl font-semibold text-nurture-charcoal"
          >
            {title}
          </ScrollRevealHeading>
          <p className="mt-3 text-nurture-charcoal/70">{subtitle}</p>
        </div>
        <div className="booking-embed-brush mx-auto mt-10 max-w-4xl">
          <div className="booking-embed-brush__inner">
            <iframe
              src={embedUrl}
              title="Schedule a call with The Nesting Place"
              className="h-[600px] w-full border-0"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookingEmbed;
