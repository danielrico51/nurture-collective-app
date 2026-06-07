import Breadcrumb from "@/components/Common/Breadcrumb";
import CoverageMap from "@/components/Common/CoverageMap";
import NestingPlaceLogo from "@/components/Common/NestingPlaceLogo";
import SectionTitle from "@/components/Common/SectionTitle";
import { TeamSection } from "@/components/Common/TeamSection";
import { brands } from "@/content/site";
import { teamMembers } from "@/content/team";
import { buildCareStartHref } from "@/config/carePaths";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | The Nesting Place",
  description:
    "Our mission, values, and leadership team at The Nesting Place — operated by Nurture Collective LLC.",
};

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

export default function AboutPage() {
  return (
    <>
      <Breadcrumb pageName="About us" />
      <section className="py-16">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <NestingPlaceLogo variant="hero" linked={false} className="mx-auto" />
            <SectionTitle
              title={brands.nestingPlace.byline}
              subtitle={`${brands.nestingPlace.name} ${brands.nestingPlace.operatorLine}`}
              centered
            />
            <div className="mt-10 space-y-6 text-nurture-charcoal/80">
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
                who knows her by name — and we welcome families wherever they are.
              </p>
            </div>

            <div className="mt-14">
              <h2 className="font-serif text-2xl font-semibold text-nurture-charcoal">
                Our values
              </h2>
              <ul className="mt-8 space-y-6">
                {values.map((value) => (
                  <li
                    key={value.title}
                    className="rounded-2xl border border-nurture-sage/15 bg-white p-6 shadow-sm"
                  >
                    <h3 className="font-serif text-lg font-semibold text-nurture-charcoal">
                      {value.title}
                    </h3>
                    <p className="mt-2 text-sm text-nurture-charcoal/75">
                      {value.description}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-12 flex flex-wrap justify-center gap-4">
              <Link
                href={buildCareStartHref()}
                className="rounded-full bg-nurture-sage px-6 py-3 text-sm font-semibold text-white hover:bg-nurture-sage-dark"
              >
                Request support
              </Link>
              <Link
                href="/contact"
                className="rounded-full border border-nurture-sage px-6 py-3 text-sm font-semibold text-nurture-sage-dark hover:bg-nurture-sage/10"
              >
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </section>
      <TeamSection members={teamMembers} className="bg-nurture-sage/5" />
      <CoverageMap
        title="Where we serve families"
        subtitle={brands.nestingPlace.serviceArea}
        className="border-t border-nurture-sage/10"
      />
    </>
  );
}
