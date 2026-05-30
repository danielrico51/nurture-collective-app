import Link from "next/link";
import { buildCareStartHref } from "@/config/carePaths";
import { featuredServiceStats } from "@/content/serviceStats";

const ServiceStatsSection = () => {
  return (
    <section className="bg-nurture-cream py-20">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-3xl font-semibold text-nurture-charcoal sm:text-4xl">
            Care that makes a measurable difference
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
                <Link
                  href={buildCareStartHref(service.slug)}
                  className="mt-6 inline-flex rounded-full bg-nurture-sage px-6 py-2.5 text-sm font-semibold text-white hover:bg-nurture-sage-dark"
                >
                  Request support
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {service.stats.map((stat) => (
                  <article
                    key={`${service.slug}-${stat.label}`}
                    className="rounded-2xl border border-nurture-sage/10 bg-white p-6 shadow-sm"
                  >
                    <p className="font-serif text-3xl font-semibold text-nurture-charcoal sm:text-4xl">
                      {stat.value}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-nurture-charcoal/70">
                      {stat.label}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-nurture-charcoal/55">
          *see{" "}
          <Link href="/sources" className="font-medium text-nurture-sage-dark hover:underline">
            sources below
          </Link>
        </p>
      </div>
    </section>
  );
};

export default ServiceStatsSection;
