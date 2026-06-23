import ServiceIcon from "@/components/Services/ServiceIcon";
import type { CoreService } from "@/content/site";
import Link from "next/link";

interface ServiceCardProps {
  service: CoreService;
  showBenefit?: boolean;
  compact?: boolean;
}

const ServiceCard = ({
  service,
  showBenefit = true,
  compact = false,
}: ServiceCardProps) => {
  const isComingSoon = service.status === "coming-soon";

  return (
    <article
      className={`flex flex-col rounded-2xl border border-nurture-oak/35 bg-nurture-cream shadow-sm transition hover:border-nurture-lilac/40 hover:shadow-md ${
        compact ? "p-6" : "p-8"
      } ${isComingSoon ? "opacity-90" : ""}`}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-nurture-lilac/25 text-nurture-grape">
          <ServiceIcon slug={service.slug} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-nurture-grape">
              {service.tag}
            </span>
            {isComingSoon ? (
              <span className="rounded-lg bg-nurture-oak/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-nurture-grape">
                Coming soon
              </span>
            ) : null}
          </div>
          <h2
            className={`mt-1 font-serif font-semibold ${
              compact ? "text-lg" : "text-xl"
            }`}
          >
            {service.title}
          </h2>
        </div>
      </div>

      <p className="mt-4 flex-1 text-sm text-nurture-charcoal/70">
        {service.description}
      </p>

      {showBenefit && service.benefit ? (
        <p className="mt-3 text-sm font-medium text-nurture-grape/90">
          {service.benefit}
        </p>
      ) : null}

      {service.availabilityNote ? (
        <p className="mt-2 text-xs text-nurture-charcoal/55">
          {service.availabilityNote}
        </p>
      ) : null}

      {isComingSoon ? (
        <Link
          href="/contact"
          className="mt-6 inline-block text-sm font-semibold text-nurture-grape hover:underline"
        >
          Contact us →
        </Link>
      ) : null}
    </article>
  );
};

export default ServiceCard;
