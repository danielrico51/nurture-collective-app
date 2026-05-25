export type GoogleReviewsVisibility = "off" | "admin" | "public";

export type GoogleReviewsMode = "placeholder" | "live";

const parseVisibility = (value: string | undefined): GoogleReviewsVisibility => {
  if (value === "public" || value === "admin" || value === "off") return value;
  return "off";
};

/** Client-safe: who may see the reviews section on marketing pages. */
export const googleReviewsVisibility: GoogleReviewsVisibility = parseVisibility(
  process.env.NEXT_PUBLIC_GOOGLE_REVIEWS_VISIBILITY?.trim()
);

export const isGoogleReviewsEnabled = (): boolean =>
  googleReviewsVisibility !== "off";

/** Server-only: placeholder sample data vs live Places API. */
export const getGoogleReviewsMode = (): GoogleReviewsMode =>
  process.env.GOOGLE_REVIEWS_MODE?.trim() === "live" ? "live" : "placeholder";

export const getGooglePlaceId = (): string | undefined =>
  process.env.GOOGLE_PLACE_ID?.trim() || undefined;

export const getGooglePlacesApiKey = (): string | undefined =>
  process.env.GOOGLE_PLACES_API_KEY?.trim() || undefined;

export const getGoogleReviewsUrl = (): string | null => {
  const fromEnv = process.env.NEXT_PUBLIC_GOOGLE_REVIEWS_URL?.trim();
  if (fromEnv) return fromEnv;
  const placeId = getGooglePlaceId();
  if (placeId) {
    return `https://www.google.com/maps/place/?q=place_id:${placeId}`;
  }
  return null;
};
