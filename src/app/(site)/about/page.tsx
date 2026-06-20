import CoverageMap from "@/components/Common/CoverageMap";
import { TeamSection } from "@/components/Common/TeamSection";
import JsonLd from "@/components/Seo/JsonLd";
import { buildCareStartHref } from "@/config/carePaths";
import { buildPageMetadata } from "@/config/seo";
import { brands } from "@/content/site";
import { teamMembers } from "@/content/team";
import { buildAboutPageJsonLd } from "@/lib/seo/jsonLd";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = buildPageMetadata({
  title: "About The Nesting Place | Maternal Wellness Team",
  description:
    "Meet The Nesting Place team — experienced birth doulas, postpartum professionals, and lactation consultants supporting families across Northern New Jersey, New York, Connecticut, and Pennsylvania.",
  path: "/about",
  keywords: [
    "The Nesting Place team",
    "maternal wellness Ridgewood NJ",
    "birth doula practice Northern NJ",
  ],
});

const values = [
  {
    title: "Real people, always",
    description: "Every family deserves a steady, human presence.",
  },
  {
    title: "Evidence-based support",
    description:
      "We connect families with experienced birth doulas, postpartum professionals, lactation specialists, and wellness providers who meet families where they are.",
  },
  {
    title: "Thoughtful coordination",
    description:
      "From your first call through postpartum, our team keeps support organized so you can focus on your family.",
  },
] as const;

/** Organic radii aligned with How it works step cards. */
const VALUE_ORGANIC_RADIUS = [
  "rounded-3xl md:rounded-[63%_37%_54%_46%/55%_48%_52%_45%]",
  "rounded-3xl md:rounded-[58%_42%_48%_52%/52%_44%_56%_48%]",
  "rounded-3xl md:rounded-[44%_56%_62%_38%/48%_56%_44%_52%]",
] as const;

export default function AboutPage() {
  return (
    <>
      <JsonLd data={buildAboutPageJsonLd(teamMembers)} />

      <section className="floating-header-offset py-12 sm:py-14">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-nurture-sage-dark">
              {brands.nestingPlace.name}
            </p>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-nurture-charcoal sm:text-4xl">
              {brands.nestingPlace.byline}
            </h2>
            <p className="mt-3 text-sm text-nurture-charcoal/65">
              {brands.nestingPlace.operatorLine}
            </p>

            <div className="mt-8 space-y-5 text-base leading-relaxed text-nurture-charcoal/80 sm:mt-10">
              <p>
                Motherhood is one of life&apos;s most profound transitions — and
                too often, families navigate it with fragmented resources and
                little rest. {brands.nestingPlace.name} exists so every mother
                has a team: vetted maternal wellness professionals and a
                dedicated support coordinator who knows your name.
              </p>
              <p>
                We began in Northern New Jersey and the Lower Hudson Valley with
                a simple promise: every mother deserves a team and a coordinator
                who knows her by name — and we welcome families wherever they
                are.
              </p>
            </div>

            <div className="mt-12 sm:mt-14">
              <h2 className="font-serif text-2xl font-semibold text-nurture-charcoal sm:text-3xl">
                Our values
              </h2>
              <ul className="mt-8 grid gap-6 sm:grid-cols-3 sm:items-stretch sm:gap-4">
                {values.map((value, index) => (
                  <li
                    key={value.title}
                    className={`flex h-full min-h-[11rem] flex-col items-center justify-center border border-nurture-sage/20 bg-[#F0EBE4] p-6 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:min-h-[12rem] sm:p-7 ${
                      VALUE_ORGANIC_RADIUS[index % VALUE_ORGANIC_RADIUS.length]
                    }`}
                  >
                    <h3 className="text-center font-serif text-lg font-semibold text-nurture-charcoal">
                      {value.title}
                    </h3>
                    <p className="mt-2 text-center text-sm leading-relaxed text-nurture-charcoal/75">
                      {value.description}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-4 sm:mt-12">
              <Link href={buildCareStartHref()} className="btn-primary-lg shadow-sm">
                Request support
              </Link>
              <Link href="/contact" className="btn-secondary-lg">
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <TeamSection
        members={teamMembers}
        className="bg-white"
        organicWaves
      />

      <section>
        <CoverageMap
          title="Where we serve families"
          subtitle={brands.nestingPlace.serviceArea}
          className="!py-12 sm:!py-14"
        />
      </section>
    </>
  );
}
