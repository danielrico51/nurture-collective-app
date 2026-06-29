import Breadcrumb from "@/components/Common/Breadcrumb";
import BookingEmbed from "@/components/Common/BookingEmbed";
import { FOOTER_SECTION_CLASS, SECTION_ABOVE_WAVE_OVERLAP_CLASS } from "@/components/Common/SectionWaveEdges";
import ContactOptions from "@/components/Common/ContactOptions";
import FaqList from "@/components/Common/FaqList";
import HowItWorksSteps from "@/components/Common/HowItWorksSteps";
import MarketingSection from "@/components/Common/MarketingSection";
import { ScrollRevealHeading } from "@/components/Common/ScrollRevealHeading.client";
import GoogleReviewsSection from "@/components/Reviews/GoogleReviewsSection";
import SectionTitle from "@/components/Common/SectionTitle";
import JsonLd from "@/components/Seo/JsonLd";
import { buildCareStartHref } from "@/config/carePaths";
import {
  MARKETING_CREAM,
  MARKETING_LILAC,
  MARKETING_OAK_SURFACE,
  marketingCard,
  marketingEyebrow,
  marketingPageShell,
} from "@/config/marketingDesign";
import { buildPageMetadata } from "@/config/seo";
import {
  brands,
  careCoordinator,
  momFaqs,
  momHowItWorks,
  publishedCoreServices,
} from "@/content/site";
import { buildFaqPageJsonLd, buildOrganizationJsonLd } from "@/lib/seo/jsonLd";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = buildPageMetadata({
  title: "Maternal Support for Moms in NJ, NY, CT & PA",
  description:
    `Birth doula support, postpartum care, lactation help, and overnight newborn support for moms through The Nesting Place — ${brands.nestingPlace.byline}.`,
  path: "/for-moms",
  keywords: [
    "maternal support for moms",
    "postpartum help New Jersey",
    "new mom support Hudson Valley",
  ],
});

export default function ForMomsPage() {
  return (
    <div className={marketingPageShell}>
      <JsonLd
        data={[buildOrganizationJsonLd(), buildFaqPageJsonLd(momFaqs)]}
      />
      <Breadcrumb pageName="For moms" />

      <section className="py-12 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className={marketingEyebrow}>For families</p>
            <ScrollRevealHeading
              as="h1"
              variant="emphasis"
              className="mt-4 font-serif text-4xl font-semibold text-nurture-charcoal sm:text-5xl"
            >
              Support that meets you where you are
            </ScrollRevealHeading>
            <p className="mt-6 text-lg text-nurture-charcoal/80">
              Start with evidence-based support from vetted providers. As{" "}
              {brands.nestingPlace.name} grows, {careCoordinator.possessive} will
              coordinate every service you need — from doula support to cleaning,
              childcare, and beyond.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href={buildCareStartHref()} className="btn-primary-lg">
                Request support
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section
        className={`${SECTION_ABOVE_WAVE_OVERLAP_CLASS} py-12 sm:py-14 lg:py-16`}
        style={{ backgroundColor: MARKETING_OAK_SURFACE }}
      >
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="Available services"
            subtitle="Experienced, evidence-based Maternal Wellness support — reach out when you're ready."
          />
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {publishedCoreServices.map((service) => (
              <article key={service.slug} className={`flex flex-col ${marketingCard}`}>
                <span className="text-xs font-semibold uppercase tracking-wide text-nurture-grape">
                  {service.tag}
                </span>
                <h2 className="mt-3 font-serif text-xl font-semibold text-nurture-charcoal">
                  {service.title}
                </h2>
                <p className="mt-3 flex-1 text-sm text-nurture-charcoal/70">
                  {service.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <MarketingSection
        waves="both"
        waveTopFill={MARKETING_OAK_SURFACE}
        waveBottomFill={MARKETING_CREAM}
        className="bg-nurture-lilac py-16 sm:py-20"
      >
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="Ready to get started?"
            subtitle="Reach out by phone, message, or schedule a call with our team."
          />
          <ContactOptions
            variant="contact"
            formHref="/contact?audience=mom"
            whatsappMessage="Hi! I'm interested in maternal support through The Nesting Place."
            className="mt-10"
          />
        </div>
      </MarketingSection>

      <GoogleReviewsSection className="bg-nurture-cream" />
      <HowItWorksSteps
        title="Your support journey"
        steps={momHowItWorks}
        organicWaves
        waveTopFill={MARKETING_CREAM}
        waveBottomFill={MARKETING_CREAM}
        className="bg-nurture-lilac"
      />
      <FaqList
        title="Questions from moms"
        items={momFaqs}
        organicWaves
        waveTopFill={MARKETING_LILAC}
      />
      <section
        className={`py-12 sm:py-14 ${FOOTER_SECTION_CLASS}`}
        style={{ backgroundColor: MARKETING_OAK_SURFACE }}
      >
        <BookingEmbed className="!py-0" />
      </section>
    </div>
  );
}
