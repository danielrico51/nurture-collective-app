import Breadcrumb from "@/components/Common/Breadcrumb";
import CoverageMap from "@/components/Common/CoverageMap";
import NestingPlaceLogo from "@/components/Common/NestingPlaceLogo";
import SectionTitle from "@/components/Common/SectionTitle";
import { brands } from "@/content/site";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | The Nurture Collective",
  description:
    "The Nurture Collective is building an AI-powered maternal concierge and provider marketplace — expanding region by region.",
};

export default function AboutPage() {
  return (
    <>
      <Breadcrumb pageName="About us" />
      <section className="py-16">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <NestingPlaceLogo
              variant="about"
              linked={false}
              className="mx-auto max-h-32"
            />
            <SectionTitle
              title="Support every mother, in every region we reach"
              subtitle={`${brands.nurtureCollective.name} is building the platform — one market at a time.`}
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
                  {brands.nurtureCollective.name}
                </span>{" "}
                is an AI-powered mom concierge and provider marketplace. We
                connect families with vetted maternal wellness professionals —
                birth doulas, postpartum support, lactation consultants, newborn
                support specialists, and more — and we&apos;re expanding into
                everyday help: cleaning, childcare, fitness, errands, and full
                concierge coordination across every stage of motherhood.
              </p>
              <p>
                We launch region by region rather than pretending to be
                everywhere at once. That keeps quality high and lets us grow
                sustainably. Recruiting exceptional service providers is
                central to the model — the network is the product.
              </p>
              <p>
                We own and operate{" "}
                <span className="font-medium text-nurture-charcoal">
                  {brands.nestingPlace.name}
                </span>
                , our maternal wellness practice in Northern New Jersey, as the
                foundation for clinical-adjacent care in our first active region.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-nurture-sage/20 bg-white p-8">
                <h3 className="font-serif text-xl font-semibold">For moms</h3>
                <p className="mt-3 text-sm text-nurture-charcoal/70">
                  Request support in your area, explore available services, and get
                  on the list for full concierge as we expand.
                </p>
                <Link
                  href="/for-moms"
                  className="mt-4 inline-block text-sm font-semibold text-nurture-sage-dark hover:underline"
                >
                  Explore support for moms →
                </Link>
              </div>
              <div className="rounded-2xl border border-nurture-sage/20 bg-white p-8">
                <h3 className="font-serif text-xl font-semibold">For providers</h3>
                <p className="mt-3 text-sm text-nurture-charcoal/70">
                  {brands.nurtureCollective.description}
                </p>
                <Link
                  href="/for-providers"
                  className="mt-4 inline-block text-sm font-semibold text-nurture-sage-dark hover:underline"
                >
                  Join as a provider →
                </Link>
              </div>
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
                  Moms preparing for the full concierge experience — support
                  beyond pre- and postpartum
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
                I&apos;m a provider
              </Link>
            </div>
          </div>
        </div>
      </section>
      <CoverageMap />
    </>
  );
}
