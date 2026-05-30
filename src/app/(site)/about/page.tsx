import Breadcrumb from "@/components/Common/Breadcrumb";
import CoverageMap from "@/components/Common/CoverageMap";
import NestingPlaceLogo from "@/components/Common/NestingPlaceLogo";
import SectionTitle from "@/components/Common/SectionTitle";
import { brands, careCoordinator, humanTouchMessage } from "@/content/site";
import { teamMembers } from "@/content/team";
import { TeamSection } from "@/components/Common/TeamSection";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | The Nesting Place",
  description:
    "The Nesting Place connects families with trusted maternal wellness providers and personal care coordinators — operated by Nurture Collective LLC.",
};

export default function AboutPage() {
  return (
    <>
      <Breadcrumb pageName="About us" />
      <section className="py-16">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <NestingPlaceLogo
              variant="hero"
              linked={false}
              className="mx-auto"
            />
            <SectionTitle
              title="Support every mother, in every region we reach"
              subtitle={`${brands.nestingPlace.name} — ${brands.nestingPlace.byline} — growing one market at a time.`}
              centered={false}
            />
            <div className="mt-10 space-y-6 text-nurture-charcoal/80">
              <p>
                Motherhood is one of life&apos;s most profound transitions —
                and too often, families navigate it with fragmented resources,
                little rest, and the quiet expectation that they should simply
                figure it out.
              </p>
              <p>
                <span className="font-medium text-nurture-charcoal">
                  {brands.nestingPlace.name}
                </span>{" "}
                ({brands.nestingPlace.byline}) is a maternal wellness practice and
                provider network. We
                connect families with vetted maternal wellness professionals —
                birth doulas, postpartum support, lactation consultants, newborn
                support specialists, and more — with a dedicated{" "}
                {careCoordinator.short.toLowerCase()} keeping everything
                organized. We&apos;re expanding into everyday help: cleaning,
                childcare, fitness, errands, and full personal care coordination
                across every stage of motherhood.
              </p>
              <p>
                We launch region by region rather than pretending to be
                everywhere at once. That keeps quality high and lets us grow
                sustainably. Recruiting exceptional service providers is
                central to the model — the network is the product.
              </p>
              <p>
                Our hands-on practice in Northern New Jersey is the foundation
                for clinical-adjacent care in our first active region — with{" "}
                {brands.nurtureCollective.shortName} building the platform behind
                it.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-nurture-sage/20 bg-white p-8">
                <h3 className="font-serif text-xl font-semibold">For moms</h3>
                <p className="mt-3 text-sm text-nurture-charcoal/70">
                  Request support in your area, explore available services, and get
                  on the list for a dedicated {careCoordinator.short.toLowerCase()} as we expand.
                </p>
                <Link
                  href="/for-moms"
                  className="mt-4 inline-block text-sm font-semibold text-nurture-sage-dark hover:underline"
                >
                  Explore support for moms →
                </Link>
              </div>
              <div className="rounded-2xl border border-nurture-sage/20 bg-white p-8">
                <p className="text-xs font-semibold uppercase tracking-wide text-nurture-sage-dark">
                  We&apos;re growing
                </p>
                <h3 className="mt-2 font-serif text-xl font-semibold">
                  Interested in joining our team?
                </h3>
                <p className="mt-3 text-sm text-nurture-charcoal/70">
                  We&apos;re actively building our team — recruiting doulas, lactation
                  consultants, newborn care specialists, and maternal wellness
                  professionals as we expand region by region.
                </p>
                <Link
                  href="/for-providers"
                  className="mt-4 inline-block text-sm font-semibold text-nurture-sage-dark hover:underline"
                >
                  Learn about joining our team →
                </Link>
              </div>
            </div>

            <div className="mt-12 rounded-2xl border border-nurture-sage/20 bg-nurture-blush/20 p-8">
              <p className="text-sm leading-relaxed text-nurture-charcoal/80">
                {humanTouchMessage}
              </p>
            </div>

            <div className="mt-12 rounded-2xl border border-nurture-sage/20 bg-nurture-cream/40 p-8">
              <h3 className="font-serif text-xl font-semibold">Who we serve</h3>
              <ul className="mt-4 list-inside list-disc space-y-2 text-nurture-charcoal/80">
                <li>Expecting and new parents in our active coverage regions</li>
                <li>
                  Families seeking doula, postpartum, lactation, and newborn
                  support through our vetted network
                </li>
                <li>
                  Moms preparing for full {careCoordinator.platform} — support
                  beyond pre- and postpartum, with a real person guiding you
                </li>
                <li>
                  Doulas, lactation consultants, and maternal wellness providers
                  building their practice with us as we scale
                </li>
              </ul>
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/for-moms"
                className="rounded-full bg-nurture-sage px-6 py-3 text-sm font-semibold text-white hover:bg-nurture-sage-dark"
              >
                I&apos;m a mom
              </Link>
              <Link
                href="/for-providers"
                className="rounded-full border border-nurture-sage px-6 py-3 text-sm font-semibold text-nurture-sage-dark hover:bg-nurture-sage/10"
              >
                Join our team
              </Link>
            </div>
          </div>
        </div>
      </section>
      <TeamSection members={teamMembers} className="bg-nurture-sage/5" />
      <CoverageMap />
    </>
  );
}
