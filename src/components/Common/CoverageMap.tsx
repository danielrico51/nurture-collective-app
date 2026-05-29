"use client";

import Link from "next/link";
import SectionTitle from "@/components/Common/SectionTitle";
import { buildCareStartHref } from "@/config/carePaths";
import { coverageStatusLabels } from "@/content/site";
import { fetchPublicCoverage } from "@/lib/api/coverageClient";
import {
  DEFAULT_COVERAGE_CONFIG,
  getPublicCoverageRegions,
} from "@/lib/coverage/defaults";
import type { CoverageStatus } from "@/types/coverage";
import { useEffect, useState } from "react";

const statusStyles: Record<CoverageStatus, string> = {
  active: "bg-nurture-sage/15 text-nurture-sage-dark",
  expanding: "bg-nurture-blush/30 text-nurture-charcoal",
  waitlist: "bg-nurture-cream text-nurture-charcoal/70",
};

interface CoverageMapProps {
  title?: string;
  subtitle?: string;
  showCta?: boolean;
  className?: string;
}

const CoverageMap = ({
  title = "Current coverage",
  subtitle,
  showCta = true,
  className = "",
}: CoverageMapProps) => {
  const [intro, setIntro] = useState(subtitle ?? DEFAULT_COVERAGE_CONFIG.intro);
  const [regions, setRegions] = useState(
    getPublicCoverageRegions(DEFAULT_COVERAGE_CONFIG).map(
      ({ id, name, status, services, coverageRatio }) => ({
        id,
        name,
        status,
        services,
        coverageRatio,
      })
    )
  );

  useEffect(() => {
    fetchPublicCoverage()
      .then((config) => {
        setIntro(subtitle ?? config.intro);
        setRegions(
          getPublicCoverageRegions(config).map(
            ({ id, name, status, services, coverageRatio }) => ({
              id,
              name,
              status,
              services,
              coverageRatio,
            })
          )
        );
      })
      .catch(() => {
        /* Defaults already shown — live config unavailable */
      });
  }, [subtitle]);

  return (
    <section id="coverage" className={`py-16 ${className}`}>
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <SectionTitle title={title} subtitle={intro} />

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {regions.map((region) => (
            <article
              key={region.id}
              className="rounded-2xl border border-nurture-sage/15 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-serif text-lg font-semibold text-nurture-charcoal">
                  {region.name}
                </h3>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusStyles[region.status]}`}
                >
                  {coverageStatusLabels[region.status]}
                </span>
              </div>
              <p className="mt-3 text-sm text-nurture-charcoal/70">
                {region.services}
              </p>
              {region.status === "expanding" && region.coverageRatio < 100 ? (
                <p className="mt-2 text-xs text-nurture-charcoal/50">
                  Expanding — {region.coverageRatio}% capacity in this region
                </p>
              ) : null}
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-dashed border-nurture-sage/25 bg-nurture-sage/5 px-6 py-5 text-center text-sm text-nurture-charcoal/70">
          Don&apos;t see your region yet?{" "}
          {showCta ? (
            <>
              <Link
                href={buildCareStartHref()}
                className="font-medium text-nurture-sage-dark hover:underline"
              >
                Request support in your area
              </Link>{" "}
              — we use demand to plan expansion.
            </>
          ) : (
            <>Request support in your area — we use demand to plan expansion.</>
          )}
        </div>
      </div>
    </section>
  );
};

export default CoverageMap;
