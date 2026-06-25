"use client";

import {
  buildBookingEmbedUrl,
  getActiveBookingUrl,
} from "@/config/bookings";

interface BookingEmbedFrameProps {
  title?: string;
  className?: string;
  heightClassName?: string;
}

const BookingEmbedFrame = ({
  title = "Schedule a call with The Nesting Place",
  className = "",
  heightClassName = "h-[560px]",
}: BookingEmbedFrameProps) => {
  const url = getActiveBookingUrl();
  if (!url) return null;

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-nurture-sage/20 bg-white ${className}`}
    >
      <iframe
        src={buildBookingEmbedUrl(url)}
        title={title}
        className={`w-full border-0 ${heightClassName}`}
        loading="lazy"
      />
    </div>
  );
};

export default BookingEmbedFrame;
