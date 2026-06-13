import { getGooglePlaceId, getGooglePlacesApiKey } from "@/config/googleReviews";
import type { GoogleReview, GoogleReviewsPayload } from "@/types/googleReview";

interface PlacesReviewRaw {
  name?: string;
  rating?: number;
  text?: { text?: string };
  relativePublishTimeDescription?: string;
  authorAttribution?: { displayName?: string };
  publishTime?: string;
}

interface PlacesDetailsResponse {
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: PlacesReviewRaw[];
}

const normalizeReview = (raw: PlacesReviewRaw, index: number): GoogleReview => ({
  id: raw.name ?? `review-${index}`,
  authorName: raw.authorAttribution?.displayName ?? "Google user",
  rating: raw.rating ?? 5,
  text: raw.text?.text ?? "",
  relativeTime: raw.relativePublishTimeDescription ?? "",
});

export const fetchLiveGoogleReviews = async (): Promise<GoogleReviewsPayload> => {
  const placeId = getGooglePlaceId();
  const apiKey = getGooglePlacesApiKey();

  if (!placeId || !apiKey) {
    throw new Error(
      "Live Google reviews require GOOGLE_PLACE_ID and GOOGLE_PLACES_API_KEY"
    );
  }

  const response = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
    {
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "rating,userRatingCount,reviews,googleMapsUri",
      },
      next: { revalidate: 86400 },
    }
  );

  if (!response.ok) {
    throw new Error(`Google Places API failed with status ${response.status}`);
  }

  const data = (await response.json()) as PlacesDetailsResponse;
  const reviews = (data.reviews ?? [])
    .filter((review) => review.text?.text)
    .slice(0, 5)
    .map(normalizeReview);

  return {
    rating: data.rating ?? 0,
    reviewCount: data.userRatingCount ?? reviews.length,
    reviews,
    isPlaceholder: false,
    googleMapsUrl: data.googleMapsUri ?? null,
  };
};
