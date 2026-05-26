"use client";

import {
  BOOKING_ANCHOR_ID,
  buildBookingEmbedUrl,
  getActiveBookingUrl,
  hasBooking,
  LEGACY_CALENDLY_ANCHOR_ID,
} from "@/config/bookings";

interface BookingEmbedProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

const BookingEmbed = ({
  title = "Schedule a free discovery call",
  subtitle = "Pick a time that works for you — we'll learn about your needs and answer your questions.",
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
          <h2 className="font-serif text-3xl font-semibold text-nurture-charcoal">
            {title}
          </h2>
          <p className="mt-3 text-nurture-charcoal/70">{subtitle}</p>
        </div>
        <div className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-2xl border border-nurture-sage/15 bg-white shadow-sm">
          <iframe
            src={embedUrl}
            title="Schedule a call with The Nurture Collective"
            className="h-[700px] w-full border-0"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
};

export default BookingEmbed;
