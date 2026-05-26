import Breadcrumb from "@/components/Common/Breadcrumb";
import CalendlyEmbed from "@/components/Common/CalendlyEmbed";
import ContactOptions from "@/components/Common/ContactOptions";
import CoverageMap from "@/components/Common/CoverageMap";
import SectionTitle from "@/components/Common/SectionTitle";
import { buildCareStartHref } from "@/config/carePaths";
import { brands, coreServices, futureConciergeServices } from "@/content/site";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services | The Nurture Collective",
  description:
    "Birth doula support, overnight newborn care, postpartum care, lactation support, and prenatal massage — available in active coverage regions, expanding over time.",
};

export default function ServicesPage() {
  return (
    <>
      <Breadcrumb pageName="Services" />
      <section className="py-16">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="Maternal wellness — available today"
            subtitle={`Evidence-based care through the ${brands.nurtureCollective.shortName} provider network. Check coverage for availability in your area.`}
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
                  Request this service →
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-24">
            <SectionTitle
              title="Full mom concierge — coming soon"
              subtitle="Every service you need, AI-coordinated in one place — rolling out in more regions over time."
            />
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {futureConciergeServices.map((service) => (
                <article
                  key={service.title}
                  className="rounded-2xl border border-dashed border-nurture-sage/30 bg-nurture-cream/40 p-8"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-nurture-sage-dark/70">
                    Coming soon
                  </p>
                  <h2 className="mt-3 font-serif text-xl font-semibold">
                    {service.title}
                  </h2>
                  <p className="mt-3 text-sm text-nurture-charcoal/65">
                    {service.description}
                  </p>
                </article>
              ))}
            </div>
            <p className="mt-10 text-center text-sm text-nurture-charcoal/60">
              Want early access to the full concierge?{" "}
              <Link
                href={buildCareStartHref()}
                className="font-medium text-nurture-sage-dark hover:underline"
              >
                Join the waitlist
              </Link>
              .
            </p>
          </div>

          <div className="mt-20">
            <SectionTitle
              title="Ready to get started?"
              subtitle="Start with guided intake, or reach out another way."
            />
            <ContactOptions
              className="mt-10"
              variant="intake"
            />
          </div>
        </div>
      </section>
      <CoverageMap />
      <CalendlyEmbed />
    </>
  );
}
