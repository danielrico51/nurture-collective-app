"use client";

import ImpactGauge from "@/components/Home/ImpactGauge";
import ServiceStatsPointList from "@/components/Home/ServiceStatsPointList";
import { buildCareStartHref, buildServiceSectionHref } from "@/config/carePaths";
import { homepageServiceBulletIconSrc } from "@/config/servicesDecor";
import {
  featuredServiceStats,
  isSlotStatPoint,
  type FeaturedServiceStats,
} from "@/content/serviceStats";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const SLOT_VARIANT_BY_SLUG = {
  "birth-doula": "sage",
  "overnight-newborn": "lilac",
  "postpartum-care": "sage",
} as const;

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg
    viewBox="0 0 20 20"
    aria-hidden
    className={`h-5 w-5 shrink-0 text-nurture-grape transition-transform duration-300 ease-in-out ${
      expanded ? "rotate-180" : ""
    }`}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface ImpactAccordionRowProps {
  service: FeaturedServiceStats;
  isActive: boolean;
  onActivate: () => void;
}

const ImpactAccordionRow = ({
  service,
  isActive,
  onActivate,
}: ImpactAccordionRowProps) => {
  const iconSrc = homepageServiceBulletIconSrc[service.slug];
  const slotVariant = SLOT_VARIANT_BY_SLUG[service.slug] ?? "sage";
  const primaryPoint = service.points.find(isSlotStatPoint);

  return (
    <article
      className={`overflow-hidden rounded-2xl border transition-all duration-300 ease-in-out ${
        isActive
          ? "border-nurture-lilac/40 bg-nurture-cream shadow-sm"
          : "border-nurture-oak/35 bg-nurture-cream/90"
      }`}
      onMouseEnter={onActivate}
      onFocus={onActivate}
    >
      <div
        className="flex cursor-default items-center gap-4 px-5 py-3 sm:px-6 sm:py-4"
        tabIndex={0}
        role="button"
        aria-expanded={isActive}
      >
        {iconSrc ? (
          <div className="relative h-14 w-[4.5rem] shrink-0 sm:h-[4.5rem] sm:w-20">
            <Image
              src={iconSrc}
              alt=""
              fill
              className="object-contain object-left"
              sizes="(max-width: 640px) 72px, 80px"
            />
          </div>
        ) : (
          <div
            className="h-14 w-[4.5rem] shrink-0 rounded-full bg-nurture-lilac/25 sm:h-[4.5rem] sm:w-20"
            aria-hidden
          />
        )}
        <h3 className="min-w-0 flex-1 font-serif text-xl font-semibold text-nurture-charcoal sm:text-2xl">
          {service.title}
        </h3>
        <ChevronIcon expanded={isActive} />
      </div>

      <div
        className={`grid transition-all duration-300 ease-in-out motion-reduce:transition-none ${
          isActive ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
        aria-hidden={!isActive}
      >
        <div className="overflow-hidden">
          <div className="grid gap-6 border-t border-nurture-oak/25 px-5 pb-6 pt-5 sm:px-6 lg:grid-cols-2 lg:items-start lg:gap-8">
            <div className="rounded-2xl border border-nurture-lilac/20 bg-nurture-cream p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-nurture-grape/80">
                Impact summary
              </p>
              {primaryPoint ? (
                <div className="mt-5">
                  <ImpactGauge point={primaryPoint} variant={slotVariant} />
                </div>
              ) : null}
              <p className="mt-5 text-base leading-relaxed text-nurture-charcoal/75">
                {service.description}
              </p>
            </div>

            <div className="flex flex-col gap-5">
              <ServiceStatsPointList
                slug={service.slug}
                points={service.points.slice(1)}
              />
              {isActive ? (
                <div className="flex flex-wrap items-center gap-3 transition-opacity duration-300 ease-in-out">
                  <Link
                    href={buildServiceSectionHref(service.slug)}
                    className="btn-secondary"
                  >
                    Explore this service
                  </Link>
                  <Link
                    href={buildCareStartHref(service.slug)}
                    className="btn-primary-grape"
                  >
                    Request support
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

const ImpactAccordion = () => {
  const [activeSlug, setActiveSlug] = useState<
    FeaturedServiceStats["slug"] | null
  >(null);

  return (
    <div
      className="space-y-3"
      onMouseLeave={() => setActiveSlug(null)}
    >
      {featuredServiceStats.map((service) => (
        <ImpactAccordionRow
          key={service.slug}
          service={service}
          isActive={activeSlug === service.slug}
          onActivate={() => setActiveSlug(service.slug)}
        />
      ))}
    </div>
  );
};

export default ImpactAccordion;
