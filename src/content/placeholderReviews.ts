import type { GoogleReviewsPayload } from "@/types/googleReview";

/** Sample reviews for layout preview — replace via live Google Places API after GBP acquisition. */
export const placeholderGoogleReviews: GoogleReviewsPayload = {
  rating: 4.9,
  reviewCount: 47,
  isPlaceholder: true,
  googleMapsUrl: null,
  reviews: [
    {
      id: "placeholder-1",
      authorName: "Sarah M.",
      rating: 5,
      relativeTime: "2 weeks ago",
      text: "Our birth doula was incredible — calm, prepared, and exactly what we needed in the room. The whole experience felt personal, not clinical.",
    },
    {
      id: "placeholder-2",
      authorName: "Jessica L.",
      rating: 5,
      relativeTime: "1 month ago",
      text: "Overnight newborn support was a lifesaver in those first weeks. I finally slept knowing our baby was in experienced hands.",
    },
    {
      id: "placeholder-3",
      authorName: "Amanda R.",
      rating: 5,
      relativeTime: "6 weeks ago",
      text: "Lactation support that actually listened to our goals — no pressure, just practical guidance. We felt supported, not judged.",
    },
    {
      id: "placeholder-4",
      authorName: "Priya K.",
      rating: 4,
      relativeTime: "2 months ago",
      text: "Postpartum support helped us set boundaries with visitors and build a recovery routine. Warm, professional, and responsive.",
    },
  ],
};
