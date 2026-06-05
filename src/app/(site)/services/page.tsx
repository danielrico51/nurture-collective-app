import Breadcrumb from "@/components/Common/Breadcrumb";
import BookingEmbed from "@/components/Common/BookingEmbed";
import ContactOptions from "@/components/Common/ContactOptions";
import SectionTitle from "@/components/Common/SectionTitle";
import { brands, publishedCoreServices } from "@/content/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services | The Nesting Place",
  description:
    "Birth doula support, overnight newborn support, postpartum support, lactation support, and prenatal massage through The Nesting Place.",
};

export default function ServicesPage() {
  return (
    <>
      <Breadcrumb pageName="Services" />
      <section className="py-16">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="Maternal Wellness — available now"
            subtitle={`Experienced, evidence-based support through ${brands.nestingPlace.name}. Reach out — our team is here to help.`}
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
                {service.availabilityNote ? (
                  <p className="mt-3 text-xs text-nurture-charcoal/55">
                    {service.availabilityNote}
                  </p>
                ) : null}
              </article>
            ))}
          </div>

          <div className="mt-20">
            <SectionTitle
              title="Ready to get started?"
              subtitle="Reach out by phone, message, or schedule a call with our team."
            />
            <ContactOptions
              className="mt-10"
              variant="contact"
              formHref="/contact?audience=mom"
            />
          </div>
        </div>
      </section>
      <BookingEmbed />
    </>
  );
}
