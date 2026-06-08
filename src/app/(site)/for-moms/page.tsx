import Breadcrumb from "@/components/Common/Breadcrumb";
import BookingEmbed from "@/components/Common/BookingEmbed";
import ContactOptions from "@/components/Common/ContactOptions";
import FaqList from "@/components/Common/FaqList";
import HowItWorksSteps from "@/components/Common/HowItWorksSteps";
import GoogleReviewsSection from "@/components/Reviews/GoogleReviewsSection";
import SectionTitle from "@/components/Common/SectionTitle";
import JsonLd from "@/components/Seo/JsonLd";
import { buildCareStartHref } from "@/config/carePaths";
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
    <>
      <JsonLd
        data={[buildOrganizationJsonLd(), buildFaqPageJsonLd(momFaqs)]}
      />
      <Breadcrumb pageName="For moms" />
      <section className="py-16">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-nurture-sage-dark">
              For families
            </p>
            <h1 className="mt-4 font-serif text-4xl font-semibold text-nurture-charcoal sm:text-5xl">
              Support that meets you where you are
            </h1>
            <p className="mt-6 text-lg text-nurture-charcoal/80">
              Start with evidence-based support from vetted providers. As{" "}
              {brands.nestingPlace.name} grows, {careCoordinator.possessive} will
              coordinate every service you need — from doula support to cleaning,
              childcare, and beyond.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href={buildCareStartHref()}
                className="rounded-full bg-nurture-sage px-8 py-3.5 text-sm font-semibold text-white hover:bg-nurture-sage-dark"
              >
                Request support
              </Link>
            </div>
          </div>

          <div className="mt-20">
            <SectionTitle
              title="Available services"
              subtitle="Experienced, evidence-based Maternal Wellness support — reach out when you're ready."
            />
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {publishedCoreServices.map((service) => (
                <article
                  key={service.slug}
                  className="flex flex-col rounded-2xl border border-nurture-sage/15 bg-white p-8 shadow-sm"
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-nurture-sage-dark">
                    {service.tag}
                  </span>
                  <h2 className="mt-3 font-serif text-xl font-semibold">
                    {service.title}
                  </h2>
                  <p className="mt-3 flex-1 text-sm text-nurture-charcoal/70">
                    {service.description}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-20">
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
        </div>
      </section>

      <GoogleReviewsSection />
      <HowItWorksSteps
        title="Your support journey"
        steps={momHowItWorks}
        className="bg-nurture-sage/5 py-20"
      />
      <FaqList title="Questions from moms" items={momFaqs} />
      <BookingEmbed />
    </>
  );
}
