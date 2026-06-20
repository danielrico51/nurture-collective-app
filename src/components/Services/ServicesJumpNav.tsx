import { buildServiceSectionHref } from "@/config/carePaths";
import type { CoreService } from "@/content/site";

interface ServicesJumpNavProps {
  services: readonly CoreService[];
}

/** Organic radii aligned with How it works step cards — scaled down for jump links. */
const SERVICE_ORGANIC_RADIUS = [
  "rounded-2xl md:rounded-[63%_37%_54%_46%/55%_48%_52%_45%]",
  "rounded-2xl md:rounded-[58%_42%_48%_52%/52%_44%_56%_48%]",
  "rounded-2xl md:rounded-[44%_56%_62%_38%/48%_56%_44%_52%]",
  "rounded-2xl md:rounded-[52%_48%_58%_42%/46%_54%_48%_56%]",
] as const;

const ServicesJumpNav = ({ services }: ServicesJumpNavProps) => (
  <nav
    aria-label="Jump to a service"
    className="rounded-2xl border border-nurture-sage/15 bg-white p-4 text-center shadow-sm sm:p-5"
  >
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-nurture-sage-dark">
      Explore our services
    </p>
    <p className="mt-1 text-sm text-nurture-charcoal/65">
      Serving North, Central, and South Jersey plus NY&apos;s Lower Hudson Valley
      — select a service to learn more.
    </p>
    <ul className="mt-3.5 flex flex-wrap justify-center gap-1.5 sm:gap-2">
      {services.map((service, index) => (
        <li
          key={service.slug}
          className="w-[calc(50%-0.375rem)] min-w-0 sm:w-[calc(25%-0.375rem)]"
        >
          <a
            href={buildServiceSectionHref(service.slug)}
            className={`inline-flex w-full items-center justify-center border border-nurture-sage/20 bg-[#F0EBE4] px-2.5 py-1.5 text-[11px] font-medium leading-snug text-nurture-charcoal shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-colors hover:border-nurture-sage/35 hover:bg-[#E8E2D9] hover:text-nurture-sage-dark sm:px-3 sm:py-1.5 sm:text-xs ${
              SERVICE_ORGANIC_RADIUS[index % SERVICE_ORGANIC_RADIUS.length]
            }`}
          >
            {service.title}
          </a>
        </li>
      ))}
    </ul>
  </nav>
);

export default ServicesJumpNav;
