import { buildServiceSectionHref } from "@/config/carePaths";
import type { CoreService } from "@/content/site";

interface ServicesJumpNavProps {
  services: readonly CoreService[];
}

const ServicesJumpNav = ({ services }: ServicesJumpNavProps) => {
  const splitIndex = Math.ceil(services.length / 2);
  const rows = [services.slice(0, splitIndex), services.slice(splitIndex)];

  return (
    <nav
      aria-label="Jump to a service"
      className="rounded-2xl border border-nurture-lilac/25 bg-nurture-cream/90 p-4 shadow-sm backdrop-blur-sm sm:p-5"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-nurture-grape">
        Explore our services
      </p>
      <p className="mt-1 text-sm text-nurture-charcoal/65">
        Serving North, Central, and South Jersey plus NY&apos;s Lower Hudson Valley — select a service to learn more.
      </p>
      <div className="mt-4 space-y-2">
        {rows.map((row, rowIndex) => (
          <ul
            key={`service-jump-row-${rowIndex}`}
            className="flex flex-wrap items-center justify-center gap-2"
          >
            {row.map((service) => (
              <li key={service.slug}>
                <a
                  href={buildServiceSectionHref(service.slug)}
                  className="inline-flex rounded-lg border border-nurture-oak/45 bg-nurture-cream px-4 py-2 text-sm font-medium text-nurture-charcoal transition hover:border-nurture-lilac hover:bg-nurture-lilac/15 hover:text-nurture-grape"
                >
                  {service.title}
                </a>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </nav>
  );
};

export default ServicesJumpNav;
