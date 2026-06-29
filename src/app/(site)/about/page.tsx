import AboutHero from "@/components/About/AboutHero";
import CoverageMap from "@/components/Common/CoverageMap";
import { FOOTER_SECTION_CLASS } from "@/components/Common/SectionWaveEdges";
import SectionTitle from "@/components/Common/SectionTitle";
import { TeamSection } from "@/components/Common/TeamSection";
import JsonLd from "@/components/Seo/JsonLd";
import { buildCareStartHref } from "@/config/carePaths";
import { marketingCard, marketingPageShell, MARKETING_OAK_SURFACE } from "@/config/marketingDesign";
import { buildPageMetadata } from "@/config/seo";
import { aboutStory } from "@/content/aboutStory";
import { brands } from "@/content/site";
import { teamMembers } from "@/content/team";
import { buildAboutPageJsonLd } from "@/lib/seo/jsonLd";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = buildPageMetadata({
  title: "About The Nesting Place | Maternal Wellness Team",
  description:
    "Learn our story and meet Alex Burleigh and Barbara Hayer — leadership supporting families across Northern New Jersey, New York, Connecticut, and Pennsylvania.",
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

export default function AboutPage() {
  return (
    <div className={marketingPageShell}>
      <JsonLd data={buildAboutPageJsonLd(teamMembers)} />

      <AboutHero />

      <section
        className="py-12 sm:py-14"
        style={{ backgroundColor: MARKETING_OAK_SURFACE }}
      >
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <SectionTitle
              title={aboutStory.title}
              revealVariant="soft"
              titleClassName="font-serif text-2xl font-semibold text-nurture-charcoal sm:text-3xl"
            />
            <p className="mt-4 text-nurture-charcoal/80">{aboutStory.intro}</p>
            <div className="mt-8 space-y-8">
              {aboutStory.chapters.map((chapter) => (
                <article
                  key={chapter.heading}
                  className={marketingCard}
                >
                  <h3 className="font-serif text-lg font-semibold text-nurture-charcoal">
                    {chapter.heading}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-nurture-charcoal/75">
                    {chapter.body}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-12 sm:mt-14">
              <SectionTitle
                title="Our values"
                revealVariant="gentle"
                titleClassName="font-serif text-2xl font-semibold text-nurture-charcoal sm:text-3xl"
              />
              <ul className="mt-8 space-y-6">
                {values.map((value) => (
                  <li
                    key={value.title}
                    className={marketingCard}
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
        title="Leadership & ownership"
        subtitle="Alex and Barb lead The Nesting Place today — with our entire team continuing the hands-on care families know and trust."
        members={teamMembers}
        organicWaves
        surface="lilac"
        waveTopFill={MARKETING_OAK_SURFACE}
      />

      <section className={FOOTER_SECTION_CLASS}>
        <CoverageMap
          title="Where we serve families"
          subtitle={brands.nestingPlace.serviceArea}
          className="!py-12 sm:!py-14"
        />
      </section>
    </div>
  );
}
