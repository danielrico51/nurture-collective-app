"use client";

import LeafMark from "@/components/Art/LeafMark";
import ServiceCardExpandedContent from "@/components/Services/ServiceCardExpandedContent";
import ServiceIllustration from "@/components/Services/ServiceIllustration";
import { buildCareStartHref } from "@/config/carePaths";
import type { ServiceDetail } from "@/content/serviceDetails";
import type { SourceCitation } from "@/content/sources";
import type { CoreService } from "@/content/site";
import type { RelatedBlogPost } from "@/lib/blog/serviceTags";
import Link from "next/link";
import { useEffect, useId, useState } from "react";

interface ServicesLandingCardProps {
  service: CoreService;
  detail?: ServiceDetail;
  researchPoints?: string[];
  sources?: SourceCitation[];
  relatedPosts?: RelatedBlogPost[];
}

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg
    viewBox="0 0 20 20"
    aria-hidden
    className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ServicesLandingCard = ({
  service,
  detail,
  researchPoints = [],
  sources = [],
  relatedPosts = [],
}: ServicesLandingCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [hashActive, setHashActive] = useState(false);
  const panelId = useId();

  useEffect(() => {
    const syncFromHash = () => {
      const active = window.location.hash === `#${service.slug}`;
      setExpanded(active);
      setHashActive(active);
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [service.slug]);

  const hasExpandableContent = Boolean(
    service.benefit ||
      detail?.whatToExpect.length ||
      researchPoints.length ||
      relatedPosts.length ||
      sources.length
  );

  return (
    <article
      id={service.slug}
      className={`group relative flex min-h-full scroll-mt-28 flex-col overflow-hidden rounded-2xl border bg-white shadow-[0_14px_35px_rgba(45,52,54,0.07)] transition hover:border-nurture-rose/30 hover:shadow-[0_18px_45px_rgba(45,52,54,0.1)] ${
        hashActive
          ? "border-nurture-sage/45 ring-2 ring-nurture-sage/25"
          : "border-nurture-sage/15"
      } p-4 sm:p-5`}
    >
      <LeafMark className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 opacity-45 transition group-hover:opacity-70 sm:bottom-4 sm:right-4" />
      <div className="flex min-h-0 flex-1 items-start gap-3 sm:gap-4">
        <div className="w-[42%] max-w-[10.5rem] shrink-0 sm:max-w-[11rem]">
          <ServiceIllustration slug={service.slug} />
        </div>

        <div className="flex min-w-0 flex-1 flex-col py-0.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-nurture-sage-dark/80">
            {service.tag}
          </span>
          <h2 className="mt-2 font-serif text-xl font-semibold leading-tight text-nurture-charcoal">
            {service.title}
          </h2>
          <p className="mt-2 flex-1 text-[13px] leading-relaxed text-nurture-charcoal/70">
            {service.description}
          </p>

          {service.availabilityNote ? (
            <p className="mt-2 text-[11px] leading-relaxed text-nurture-charcoal/55">
              {service.availabilityNote}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {hasExpandableContent ? (
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setExpanded((open) => !open)}
                className="inline-flex items-center gap-1 rounded-full border border-nurture-sage/25 px-3 py-1.5 text-[11px] font-semibold text-nurture-sage-dark transition hover:border-nurture-sage/45 hover:bg-nurture-sage/5"
              >
                {expanded ? "Show less" : "Learn more"}
                <ChevronIcon expanded={expanded} />
              </button>
            ) : null}
            <Link
              href={buildCareStartHref(service.slug)}
              className="inline-flex items-center rounded-full bg-nurture-sage px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-nurture-sage-dark"
            >
              Request support
            </Link>
          </div>
        </div>
      </div>

      {hasExpandableContent ? (
        <div
          id={panelId}
          aria-hidden={!expanded}
          className={`border-t border-nurture-sage/10 pt-4 ${
            expanded
              ? "mt-4"
              : "sr-only mt-0 max-h-0 overflow-hidden border-0 pt-0"
          }`}
        >
          <ServiceCardExpandedContent
            service={service}
            detail={detail}
            researchPoints={researchPoints}
            sources={sources}
            relatedPosts={relatedPosts}
          />
        </div>
      ) : null}
    </article>
  );
};

export default ServicesLandingCard;
