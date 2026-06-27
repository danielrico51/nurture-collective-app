import EventsCtaBanner from "@/components/Events/EventsCtaBanner";
import EventsHero from "@/components/Events/EventsHero";
import EventsJumpNav from "@/components/Events/EventsJumpNav";
import EventsListingCard from "@/components/Events/EventsListingCard";
import SectionTitle from "@/components/Common/SectionTitle";
import SectionWaveEdges, {
  FOOTER_CLEARANCE_PADDING_CLASS,
} from "@/components/Common/SectionWaveEdges";
import JsonLd from "@/components/Seo/JsonLd";
import { MARKETING_CREAM, MARKETING_OAK_SURFACE, marketingCard, marketingPageShell } from "@/config/marketingDesign";
import { classRefundPolicy } from "@/content/events";
import { brands } from "@/content/site";
import { buildPageMetadata } from "@/config/seo";
import { fetchPublishedEvents } from "@/lib/events/public";
import { buildOrganizationJsonLd } from "@/lib/seo/jsonLd";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Events & Childbirth Classes in NJ & NY",
  description:
    "Workshops, childbirth education, and community gatherings from The Nesting Place for families in Northern New Jersey, New York, Connecticut, and Pennsylvania.",
  path: "/events-and-classes",
  keywords: [
    "childbirth education New Jersey",
    "prenatal classes Northern NJ",
    "new mom support groups NY",
  ],
});

export default async function EventsAndClassesPage() {
  const items = await fetchPublishedEvents();
  const classes = items.filter((item) => item.kind === "class");
  const events = items.filter((item) => item.kind === "event");

  return (
    <div className={marketingPageShell}>
      <JsonLd data={buildOrganizationJsonLd()} />
      <EventsHero />

      <section
        id="events-listings"
        className="scroll-mt-24 py-10 sm:scroll-mt-28 sm:py-12 md:scroll-mt-32 md:py-14"
        style={{ backgroundColor: MARKETING_OAK_SURFACE }}
      >
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
          <SectionTitle
            title="Sessions for every stage"
            subtitle={`Classes and community events from ${brands.nestingPlace.name} — in person, virtual, and hybrid.`}
            revealVariant="gentle"
            titleClassName="font-serif text-3xl font-semibold text-nurture-charcoal sm:text-4xl"
          />
          </div>

          {items.length > 0 ? (
            <div className="mt-10">
              <EventsJumpNav
                showClasses={classes.length > 0}
                showEvents={events.length > 0}
              />
            </div>
          ) : null}

          {items.length === 0 ? (
            <div className={`mx-auto mt-12 max-w-lg ${marketingCard} text-center`}>
              <p className="text-nurture-charcoal/70">
                New sessions are being scheduled. Contact us to get on the list.
              </p>
              <Link href="/contact" className="btn-primary mt-6 shadow-sm">
                Contact us
              </Link>
            </div>
          ) : (
            <div className="mt-10 space-y-12 sm:space-y-14">
              {classes.length > 0 ? (
                <div id="classes" className="scroll-mt-24 sm:scroll-mt-28 md:scroll-mt-32">
                  <h3 className="font-serif text-2xl font-semibold text-nurture-charcoal sm:text-3xl">
                    Classes
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm text-nurture-charcoal/65 sm:text-base">
                    Childbirth education and skill-building sessions led by our
                    care team.
                  </p>
                  <ul className="mt-6 grid gap-6 md:grid-cols-2 lg:gap-8">
                    {classes.map((item) => (
                      <li key={item.slug}>
                        <EventsListingCard item={item} />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {events.length > 0 ? (
                <div id="events" className="scroll-mt-24 sm:scroll-mt-28 md:scroll-mt-32">
                  <h3 className="font-serif text-2xl font-semibold text-nurture-charcoal sm:text-3xl">
                    Events
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm text-nurture-charcoal/65 sm:text-base">
                    Community gatherings, workshops, and special programs.
                  </p>
                  <ul className="mt-6 grid gap-6 md:grid-cols-2 lg:gap-8">
                    {events.map((item) => (
                      <li key={item.slug}>
                        <EventsListingCard item={item} />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </section>

      <section
        className={`relative overflow-hidden py-12 sm:py-14 ${FOOTER_CLEARANCE_PADDING_CLASS}`}
        style={{ backgroundColor: MARKETING_CREAM }}
      >
        <SectionWaveEdges topOnly topFill={MARKETING_OAK_SURFACE} />
        <div className="relative z-[2] mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className={`mx-auto max-w-3xl ${marketingCard}`}>
            <h2 className="font-serif text-2xl font-semibold text-nurture-charcoal sm:text-3xl">
              {classRefundPolicy.title}
            </h2>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-nurture-charcoal/75 sm:text-base">
              {classRefundPolicy.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="relative z-[2] mt-10 mb-2 sm:mt-12 sm:mb-4">
            <EventsCtaBanner />
          </div>
        </div>
      </section>
    </div>
  );
}
