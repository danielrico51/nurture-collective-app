import { NextResponse } from "next/server";
import {
  getGoogleReviewsMode,
  getGoogleReviewsUrl,
} from "@/config/googleReviews";
import { placeholderGoogleReviews } from "@/content/placeholderReviews";
import { fetchLiveGoogleReviews } from "@/lib/google/placesReviews";

export const dynamic = "force-dynamic";

export async function GET() {
  const mode = getGoogleReviewsMode();

  try {
    if (mode === "live") {
      const live = await fetchLiveGoogleReviews();
      const mapsUrl = live.googleMapsUrl ?? getGoogleReviewsUrl();
      return NextResponse.json({
        ...live,
        googleMapsUrl: mapsUrl,
      });
    }

    return NextResponse.json({
      ...placeholderGoogleReviews,
      googleMapsUrl: getGoogleReviewsUrl(),
    });
  } catch (error) {
    console.error("[reviews] Failed to load reviews:", error);

    if (mode === "live") {
      return NextResponse.json(
        {
          error: "Could not load Google reviews",
          fallback: {
            ...placeholderGoogleReviews,
            googleMapsUrl: getGoogleReviewsUrl(),
          },
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: "Could not load reviews" },
      { status: 500 }
    );
  }
}
