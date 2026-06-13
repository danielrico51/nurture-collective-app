"use client";

import SectionTitle from "@/components/Common/SectionTitle";
import type { GoogleReview, GoogleReviewsPayload } from "@/types/googleReview";
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

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg
    viewBox="0 0 20 20"
    aria-hidden
    className={`h-4 w-4 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface ReviewSnippetProps {
  review: GoogleReview;
  isOpen: boolean;
  onToggle: () => void;
}

const ReviewSnippet = ({ review, isOpen, onToggle }: ReviewSnippetProps) => {
  const panelId = `review-${review.id}`;

  return (
    <div className="py-3">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 text-left"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium text-nurture-charcoal">{review.authorName}</span>
            <StarRating rating={review.rating} />
          </span>
          {review.relativeTime ? (
            <span className="mt-0.5 block text-xs text-nurture-charcoal/50">
              {review.relativeTime}
            </span>
          ) : null}
        </span>
        <span className="pt-0.5 text-nurture-sage-dark">
          <ChevronIcon expanded={isOpen} />
        </span>
      </button>
      <div
        id={panelId}
        aria-hidden={!isOpen}
        className={
          isOpen
            ? "mt-2 text-sm leading-relaxed text-nurture-charcoal/75"
            : "sr-only text-sm leading-relaxed text-nurture-charcoal/75"
        }
      >
        {review.text}
      </div>
    </div>
  );
};

interface GoogleReviewsProps {
  className?: string;
}

const GoogleReviews = ({ className = "" }: GoogleReviewsProps) => {
  const [data, setData] = useState<GoogleReviewsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openReviewIds, setOpenReviewIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    fetch("/api/reviews")
      .then(async (response) => {
        const contentType = response.headers.get("content-type") ?? "";
        if (!contentType.includes("application/json")) {
          throw new Error("Could not load reviews");
        }

        const payload = (await response.json()) as
          | GoogleReviewsPayload
          | { error?: string; fallback?: GoogleReviewsPayload };

        if (!response.ok) {
          if ("fallback" in payload && payload.fallback) {
            setData(payload.fallback);
            return;
          }
          throw new Error(
            ("error" in payload && payload.error) || "Could not load reviews"
          );
        }

        setData(payload as GoogleReviewsPayload);
      })
      .catch(() => {
        setError("Could not load reviews");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className={`py-12 ${className}`}>
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-nurture-charcoal/60">
            Loading reviews…
          </p>
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className={`py-12 ${className}`}>
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-red-700/90">
            {error ?? "Could not load reviews"}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={`py-12 ${className}`}>
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        {data.isPlaceholder ? (
          <div className="mb-6 rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900/90">
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

        <div className="mx-auto mt-6 flex max-w-xl flex-col items-center gap-3 text-center sm:flex-row sm:justify-center sm:gap-4">
          <StarRating rating={data.rating} />
          <p className="text-sm text-nurture-charcoal/70">
            <span className="font-semibold text-nurture-charcoal">
              {data.rating.toFixed(1)}
            </span>{" "}
            · {data.reviewCount} Google reviews
          </p>
          {data.googleMapsUrl ? (
            <a
              href={data.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-nurture-sage-dark hover:underline"
            >
              See all on Google →
            </a>
          ) : null}
        </div>

        {data.reviews.length > 0 ? (
          <div className="mx-auto mt-8 grid max-w-4xl gap-4 md:grid-cols-2">
            {data.reviews.map((review) => (
              <article
                key={review.id}
                className="rounded-xl border border-nurture-sage/15 bg-white px-4 shadow-sm"
              >
                <ReviewSnippet
                  review={review}
                  isOpen={openReviewIds.has(review.id)}
                  onToggle={() =>
                    setOpenReviewIds((current) => {
                      const next = new Set(current);
                      if (next.has(review.id)) next.delete(review.id);
                      else next.add(review.id);
                      return next;
                    })
                  }
                />
              </article>
            ))}
          </div>
        ) : null}

        {!data.googleMapsUrl ? (
          <p className="mt-6 text-center text-xs text-nurture-charcoal/45">
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
        ) : null}
      </div>
    </section>
  );
};

export default GoogleReviews;
