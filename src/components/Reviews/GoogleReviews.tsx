"use client";

import SectionTitle from "@/components/Common/SectionTitle";
import type { GoogleReviewsPayload } from "@/types/googleReview";
import { useEffect, useState } from "react";

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
    {Array.from({ length: 5 }).map((_, index) => (
      <span
        key={index}
        className={
          index < Math.round(rating) ? "text-amber-500" : "text-nurture-charcoal/20"
        }
      >
        ★
      </span>
    ))}
  </div>
);

interface GoogleReviewsProps {
  className?: string;
}

const GoogleReviews = ({ className = "" }: GoogleReviewsProps) => {
  const [data, setData] = useState<GoogleReviewsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/reviews")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          if (payload.fallback) {
            setData(payload.fallback as GoogleReviewsPayload);
            return;
          }
          throw new Error(payload.error ?? "Could not load reviews");
        }
        setData(payload as GoogleReviewsPayload);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not load reviews");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className={`py-16 ${className}`}>
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-nurture-charcoal/60">
            Loading reviews…
          </p>
        </div>
      </section>
    );
  }

  if (error || !data) {
    return null;
  }

  return (
    <section className={`py-16 ${className}`}>
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        {data.isPlaceholder ? (
          <div className="mb-8 rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900/90">
            <span className="font-semibold">Preview only</span> — sample reviews
            for layout. Connect Google Business Profile after acquisition to
            show live ratings.
          </div>
        ) : null}

        <SectionTitle
          title="What families are saying"
          subtitle={
            data.isPlaceholder
              ? "Placeholder social proof — real Google reviews will appear here after integration."
              : "Rated on Google by families in our network."
          }
        />

        <div className="mx-auto mt-8 flex max-w-md flex-col items-center gap-2 text-center">
          <StarRating rating={data.rating} />
          <p className="text-sm text-nurture-charcoal/70">
            <span className="font-semibold text-nurture-charcoal">
              {data.rating.toFixed(1)}
            </span>{" "}
            · {data.reviewCount} Google reviews
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {data.reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-2xl border border-nurture-sage/15 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="font-medium text-nurture-charcoal">
                  {review.authorName}
                </p>
                <StarRating rating={review.rating} />
              </div>
              {review.relativeTime ? (
                <p className="mt-1 text-xs text-nurture-charcoal/50">
                  {review.relativeTime}
                </p>
              ) : null}
              <p className="mt-3 text-sm leading-relaxed text-nurture-charcoal/75">
                {review.text}
              </p>
            </article>
          ))}
        </div>

        {data.googleMapsUrl ? (
          <div className="mt-10 text-center">
            <a
              href={data.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-nurture-sage-dark hover:underline"
            >
              See all reviews on Google →
            </a>
          </div>
        ) : (
          <p className="mt-10 text-center text-xs text-nurture-charcoal/45">
            Set{" "}
            <code className="rounded bg-nurture-cream px-1.5 py-0.5">
              NEXT_PUBLIC_GOOGLE_REVIEWS_URL
            </code>{" "}
            or{" "}
            <code className="rounded bg-nurture-cream px-1.5 py-0.5">
              GOOGLE_PLACE_ID
            </code>{" "}
            when your Google Business Profile is ready.
          </p>
        )}
      </div>
    </section>
  );
};

export default GoogleReviews;
