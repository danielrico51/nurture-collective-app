"use client";

import CoverageMap from "@/components/Common/CoverageMap";
import PageIntroWithImage from "@/components/Common/PageIntroWithImage";
import SectionTitle from "@/components/Common/SectionTitle";
import { TeamSection } from "@/components/Common/TeamSection";
import JsonLd from "@/components/Seo/JsonLd";
import { buildCareStartHref } from "@/config/carePaths";
import { pageArtwork } from "@/config/pageArtwork";
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
    <>
      <JsonLd data={buildAboutPageJsonLd(teamMembers)} />

      <section className="floating-header-offset pb-12 sm:pb-14">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <PageIntroWithImage
            imageSrc={pageArtwork.aboutCoffee.src}
            imageAlt={pageArtwork.aboutCoffee.alt}
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-nurture-sage-dark">
              {brands.nestingPlace.name}
            </p>
            <SectionTitle
              title={brands.nestingPlace.byline}
              revealVariant="emphasis"
              centered={false}
              titleClassName="mt-4 font-serif text-3xl font-semibold text-nurture-charcoal sm:text-4xl"
            />
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
          </PageIntroWithImage>

          <div className="mx-auto mt-12 max-w-3xl text-center sm:mt-14">
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
                  className="rounded-2xl border border-nurture-sage/15 bg-white p-6 shadow-sm"
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
        className="bg-nurture-sage/5"
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
