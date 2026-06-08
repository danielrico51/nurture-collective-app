import Link from "next/link";
import { buildCareStartHref, buildServiceSectionHref } from "@/config/carePaths";
import { featuredServiceStats } from "@/content/serviceStats";

const ServiceStatsSection = () => {
  return (
    <section className="bg-nurture-cream py-20">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-3xl font-semibold text-nurture-charcoal sm:text-4xl">
            Support that makes a measurable difference
          </h2>
          <p className="mt-4 text-lg text-nurture-charcoal/70">
            Our core services are backed by research on better outcomes for moms
            and babies — with real people delivering every step of support.
          </p>
        </div>

        <div className="mt-14 space-y-16">
          {featuredServiceStats.map((service) => (
            <div
              key={service.slug}
              className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center"
            >
              <div>
                <h3 className="font-serif text-2xl font-semibold text-nurture-charcoal sm:text-3xl">
                  {service.title}
                </h3>
                <p className="mt-4 text-base leading-relaxed text-nurture-charcoal/75">
                  {service.description}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link
                    href={buildServiceSectionHref(service.slug)}
                    className="inline-flex rounded-full border border-nurture-sage/30 px-6 py-2.5 text-sm font-semibold text-nurture-sage-dark hover:bg-nurture-sage/10"
                  >
                    Explore this service
                  </Link>
                  <Link
                    href={buildCareStartHref(service.slug)}
                    className="inline-flex rounded-full bg-nurture-sage px-6 py-2.5 text-sm font-semibold text-white hover:bg-nurture-sage-dark"
                  >
                    Request support
                  </Link>
                </div>
              </div>

              <ul className="space-y-4 rounded-2xl border border-nurture-sage/10 bg-white p-6 shadow-sm sm:p-8">
                {service.points.map((point) => (
                  <li
                    key={`${service.slug}-${point}`}
                    className="flex gap-3 text-base leading-relaxed text-nurture-charcoal/80"
                  >
                    <span
                      aria-hidden
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nurture-sage"
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-nurture-charcoal/55">
          Statistics are drawn from published research. See our{" "}
          <Link href="/sources" className="font-medium text-nurture-sage-dark hover:underline">
            Sources
          </Link>{" "}
          page for citations.
        </p>
      </div>
    </section>
  );
};

export default ServiceStatsSection;
