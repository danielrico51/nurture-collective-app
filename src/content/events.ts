/**
 * @deprecated Events are stored in S3 — see `src/lib/events/storage.ts`.
 */
export type { EventFormat, EventKind, EventListingStatus } from "@/types/event";

export const classRefundPolicy = {
  title: "Refund & Cancellation Policy",
  paragraphs: [
    "All class registrations are non-refundable. Classes are limited in size.",
    "Cancellations made 7 or more days before the class may receive a credit toward a future class or service. Cancellations made within 7 days of the class are not eligible for a refund or credit.",
    "If a waiting list exists and the spot is filled, a credit may be issued.",
    "Credits are non-transferable and have no cash value.",
  ],
} as const;
