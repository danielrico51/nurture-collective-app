import Link from "next/link";
import SectionTitle from "@/components/Common/SectionTitle";
import { buildCareStartHref } from "@/config/carePaths";
import {
  coverageIntro,
  coverageRegions,
  coverageStatusLabels,
  type CoverageStatus,
} from "@/content/site";

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
  subtitle = coverageIntro,
  showCta = true,
  className = "",
}: CoverageMapProps) => {
  return (
    <section id="coverage" className={`py-16 ${className}`}>
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <SectionTitle title={title} subtitle={subtitle} />

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {coverageRegions.map((region) => (
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
