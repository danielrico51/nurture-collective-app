import Breadcrumb from "@/components/Common/Breadcrumb";
import ContactOptions from "@/components/Common/ContactOptions";
import FaqList from "@/components/Common/FaqList";
import HowItWorksSteps from "@/components/Common/HowItWorksSteps";
import SectionTitle from "@/components/Common/SectionTitle";
import {
  brands,
  careCoordinator,
  providerFaqs,
  providerHowItWorks,
  providerSpecialties,
} from "@/content/site";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Service Providers | The Nesting Place",
  description:
    "Join The Nesting Place provider network. We're recruiting doulas, lactation consultants, newborn care specialists, and more.",
};

export default function ForProvidersPage() {
  return (
    <>
      <Breadcrumb pageName="For providers" />
      <section className="py-16">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-nurture-sage-dark">
              For professionals
            </p>
            <h1 className="mt-4 font-serif text-4xl font-semibold text-nurture-charcoal sm:text-5xl">
              Grow your practice with a team that puts moms first
            </h1>
            <p className="mt-6 text-lg text-nurture-charcoal/80">
              {brands.nestingPlace.name} is building a provider network with
              personal care coordinators who match exceptional providers with
              families who need them. Provider recruitment is essential to our
              success — we&apos;d love to hear from you.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/contact?audience=provider"
                className="rounded-full bg-nurture-sage px-8 py-3.5 text-sm font-semibold text-white hover:bg-nurture-sage-dark"
              >
                Apply to join
              </Link>
              <Link
                href="/signin"
                className="rounded-full border border-nurture-sage px-8 py-3.5 text-sm font-semibold text-nurture-sage-dark hover:bg-nurture-sage/10"
              >
                Provider sign in
              </Link>
            </div>
          </div>

          <div className="mt-20 rounded-2xl border border-nurture-sage/20 bg-white p-8 md:p-12">
            <SectionTitle
              title="Who we're recruiting"
              subtitle="Priority roles as we grow our provider network."
              centered={false}
            />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {providerSpecialties.map((specialty) => (
                <div
                  key={specialty.slug}
                  className="rounded-xl border border-nurture-sage/15 bg-nurture-cream/40 px-5 py-4 text-sm font-medium text-nurture-charcoal"
                >
                  {specialty.label}
                </div>
              ))}
            </div>
            <p className="mt-8 text-sm text-nurture-charcoal/70">
              Don&apos;t see your specialty?{" "}
              <Link
                href="/contact?audience=provider&specialty=other"
                className="font-medium text-nurture-sage-dark hover:underline"
              >
                Tell us about your work
              </Link>
              .
            </p>
          </div>

          <div className="mt-20">
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
                <div
                  key={item.title}
                  className="rounded-2xl border border-nurture-sage/15 bg-white p-6 shadow-sm"
                >
                  <h3 className="font-serif text-lg font-semibold">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm text-nurture-charcoal/70">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-20">
            <ContactOptions
              formHref="/contact?audience=provider#contact-form"
              whatsappMessage="Hi! I'm interested in joining The Nesting Place provider network."
            />
          </div>
        </div>
      </section>

      <HowItWorksSteps
        title="Provider onboarding"
        steps={providerHowItWorks}
        className="bg-nurture-sage/5 py-20"
      />
      <FaqList title="Questions from providers" items={providerFaqs} />
    </>
  );
}
