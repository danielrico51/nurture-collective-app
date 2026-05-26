import { brands, coreServices } from "@/content/site";
import SectionTitle from "@/components/Common/SectionTitle";
import Link from "next/link";

const CoreServicesSection = () => {
  return (
    <section className="bg-nurture-sage/5 py-20">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title="Maternal wellness services"
          subtitle={`Evidence-based support through the ${brands.nurtureCollective.shortName} provider network — availability varies by region.`}
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {coreServices.slice(0, 3).map((service) => (
            <div
              key={service.slug}
              className="rounded-2xl border border-nurture-sage/15 bg-white p-6 shadow-sm"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-nurture-sage-dark">
                {service.tag}
              </span>
              <h3 className="mt-2 font-serif text-lg font-semibold">
                {service.title}
              </h3>
              <p className="mt-2 text-sm text-nurture-charcoal/70">
                {service.description}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            href="/services"
            className="text-sm font-semibold text-nurture-sage-dark hover:underline"
          >
            View all services →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CoreServicesSection;
