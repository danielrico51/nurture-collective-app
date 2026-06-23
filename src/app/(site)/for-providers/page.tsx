import Breadcrumb from "@/components/Common/Breadcrumb";
import ContactOptions from "@/components/Common/ContactOptions";
import FaqList from "@/components/Common/FaqList";
import HowItWorksSteps from "@/components/Common/HowItWorksSteps";
import MarketingSection from "@/components/Common/MarketingSection";
import { ScrollRevealHeading } from "@/components/Common/ScrollRevealHeading.client";
import SectionTitle from "@/components/Common/SectionTitle";
import {
  MARKETING_CREAM,
  MARKETING_LILAC,
  MARKETING_OAK_SURFACE,
  marketingCard,
  marketingCardCompact,
  marketingEyebrow,
  marketingLink,
  marketingPageShell,
} from "@/config/marketingDesign";
import { buildPageMetadata } from "@/config/seo";
import {
  brands,
  providerFaqs,
  providerHowItWorks,
  providerSpecialties,
} from "@/content/site";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = buildPageMetadata({
  title: "Join Our Provider Network | The Nesting Place",
  description:
    "Join The Nesting Place provider network in NJ, NY, CT, and PA. We're recruiting birth doulas, lactation consultants, newborn care specialists, and maternal wellness professionals.",
  path: "/for-providers",
  keywords: [
    "doula jobs New Jersey",
    "lactation consultant network NY",
    "postpartum doula opportunities",
  ],
});

export default function ForProvidersPage() {
  return (
    <div className={marketingPageShell}>
      <Breadcrumb pageName="For providers" />

      <section className="py-12 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className={marketingEyebrow}>For professionals</p>
            <ScrollRevealHeading
              as="h1"
              variant="emphasis"
              className="mt-4 font-serif text-4xl font-semibold text-nurture-charcoal sm:text-5xl"
            >
              Grow your practice with a team that puts moms first
            </ScrollRevealHeading>
            <p className="mt-6 text-lg text-nurture-charcoal/80">
              {brands.nestingPlace.name} is building a provider network with
              personal care coordinators who match exceptional providers with
              families who need them. Provider recruitment is essential to our
              success — we&apos;d love to hear from you.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/contact?audience=provider"
                className="btn-primary-lg"
              >
                Apply to join
              </Link>
              <Link href="/signin" className="btn-secondary-lg">
                Provider sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section
        className="py-12 sm:py-14 lg:py-16"
        style={{ backgroundColor: MARKETING_OAK_SURFACE }}
      >
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className={marketingCard}>
            <SectionTitle
              title="Who we're recruiting"
              subtitle="Priority roles as we grow our provider network."
              centered={false}
            />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {providerSpecialties.map((specialty) => (
                <div
                  key={specialty.slug}
                  className="rounded-xl border border-nurture-lilac/25 bg-nurture-cream/80 px-5 py-4 text-sm font-medium text-nurture-charcoal"
                >
                  {specialty.label}
                </div>
              ))}
            </div>
            <p className="mt-8 text-sm text-nurture-charcoal/70">
              Don&apos;t see your specialty?{" "}
              <Link
                href="/contact?audience=provider&specialty=other"
                className={marketingLink}
              >
                Tell us about your work
              </Link>
              .
            </p>
          </div>

          <div className="mt-16">
            <SectionTitle
              title="Why partner with us?"
              subtitle="A marketplace built for thoughtful matching — personal relationships, not automated lists."
            />
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "Join early",
                  description:
                    "Shape standards, onboarding, and the matching experience as we build the full personal care coordination platform.",
                },
                {
                  title: "Expand with us",
                  description:
                    "Grow your practice alongside a team that values quality, communication, and family-centered care.",
                },
                {
                  title: "Get matched with families",
                  description:
                    "As we scale, our platform connects your expertise with moms who need exactly what you offer.",
                },
              ].map((item) => (
                <div key={item.title} className={marketingCardCompact}>
                  <h3 className="font-serif text-lg font-semibold text-nurture-charcoal">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm text-nurture-charcoal/70">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
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
          <ContactOptions
            formHref="/contact?audience=provider#contact-form"
            whatsappMessage="Hi! I'm interested in joining The Nesting Place provider network."
          />
        </div>
      </MarketingSection>

      <HowItWorksSteps
        title="Provider onboarding"
        steps={providerHowItWorks}
        organicWaves
        waveTopFill={MARKETING_CREAM}
        waveBottomFill={MARKETING_CREAM}
        className="bg-nurture-lilac"
      />
      <FaqList
        title="Questions from providers"
        items={providerFaqs}
        organicWaves
        waveTopFill={MARKETING_LILAC}
      />
    </div>
  );
}
