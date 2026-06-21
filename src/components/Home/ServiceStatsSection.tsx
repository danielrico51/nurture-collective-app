"use client";

import Link from "next/link";
import { ScrollRevealHeading } from "@/components/Common/ScrollRevealHeading.client";
import ServiceStatsPointList from "@/components/Home/ServiceStatsPointList";
import { buildCareStartHref, buildServiceSectionHref } from "@/config/carePaths";
import { featuredServiceStats } from "@/content/serviceStats";

const ServiceStatsSection = () => {
  return (
    <section className="bg-nurture-cream py-12 sm:py-14">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <ScrollRevealHeading
            variant="default"
            className="font-serif text-3xl font-semibold text-nurture-charcoal sm:text-4xl"
          >
            Support that makes a measurable difference
          </ScrollRevealHeading>
          <p className="mt-3 text-lg text-nurture-charcoal/70">
            Our core services are backed by research on better outcomes for moms
            and babies — with real people delivering every step of support.
          </p>
        </div>

        <div className="mt-10 space-y-10 sm:space-y-12">
          {featuredServiceStats.map((service) => (
            <div
              key={service.slug}
              className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center lg:gap-8"
            >
              <div>
                <h3 className="font-serif text-2xl font-semibold text-nurture-charcoal sm:text-3xl">
                  {service.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-nurture-charcoal/75">
                  {service.description}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Link
                    href={buildServiceSectionHref(service.slug)}
                    className="inline-flex rounded-full border border-nurture-sage/30 bg-white px-6 py-2.5 text-sm font-semibold text-nurture-sage-dark hover:bg-nurture-cream"
                  >
                    Explore this service
                  </Link>
                  <Link
                    href={buildCareStartHref(service.slug)}
                    className="btn-primary"
                  >
                    Request support
                  </Link>
                </div>
              </div>

              <ServiceStatsPointList slug={service.slug} points={service.points} />            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-nurture-charcoal/55">
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
