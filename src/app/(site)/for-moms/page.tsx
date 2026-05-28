import Breadcrumb from "@/components/Common/Breadcrumb";
import CalendlyEmbed from "@/components/Common/CalendlyEmbed";
import ContactOptions from "@/components/Common/ContactOptions";
import CoverageMap from "@/components/Common/CoverageMap";
import FaqList from "@/components/Common/FaqList";
import HowItWorksSteps from "@/components/Common/HowItWorksSteps";
import GoogleReviewsSection from "@/components/Reviews/GoogleReviewsSection";
import SectionTitle from "@/components/Common/SectionTitle";
import { buildCareStartHref } from "@/config/carePaths";
import { brands, careCoordinator, coreServices, momFaqs, momHowItWorks } from "@/content/site";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Moms | The Nesting Place",
  description:
    "Birth doula support, postpartum support, lactation, and newborn support through The Nesting Place — by Nurture Collective LLC.",
};

export default function ForMomsPage() {
  return (
    <>
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
              Start with evidence-based support from vetted providers in your
              region. As {brands.nestingPlace.name} grows,{" "}
              {careCoordinator.possessive} will coordinate every service you
              need — from doula support to cleaning, childcare, and beyond.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href={buildCareStartHref()}
                className="rounded-full bg-nurture-sage px-8 py-3.5 text-sm font-semibold text-white hover:bg-nurture-sage-dark"
              >
                Request support
              </Link>
              <Link
                href="/services"
                className="rounded-full border border-nurture-sage px-8 py-3.5 text-sm font-semibold text-nurture-sage-dark hover:bg-nurture-sage/10"
              >
                View services
              </Link>
            </div>
          </div>

          <div className="mt-20">
            <SectionTitle
              title="Available services"
              subtitle="Experienced, evidence-based maternal wellness — check coverage for availability in your area."
            />
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {coreServices.map((service) => (
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
                  <Link
                    href={buildCareStartHref(service.slug)}
                    className="mt-6 inline-block text-sm font-semibold text-nurture-sage-dark hover:underline"
                  >
                    Get started →
                  </Link>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-20">
            <SectionTitle
              title="Ready to get started?"
              subtitle="Begin with our guided intake — we'll personalize recommendations for your journey."
            />
            <ContactOptions
              variant="intake"
              whatsappMessage="Hi! I'm interested in maternal support through The Nesting Place."
              className="mt-10"
            />
          </div>
        </div>
      </section>

      <CoverageMap />
      <GoogleReviewsSection />
      <HowItWorksSteps
        title="Your support journey"
        steps={momHowItWorks}
        className="bg-nurture-sage/5 py-20"
      />
      <FaqList title="Questions from moms" items={momFaqs} />
      <CalendlyEmbed title="Schedule a discovery call" />
    </>
  );
}
