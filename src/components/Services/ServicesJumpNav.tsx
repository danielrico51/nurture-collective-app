import { buildServiceSectionHref } from "@/config/carePaths";
import type { CoreService } from "@/content/site";

interface ServicesJumpNavProps {
  services: readonly CoreService[];
}

const ServicesJumpNav = ({ services }: ServicesJumpNavProps) => (
  <nav
    aria-label="Jump to a service"
    className="rounded-2xl border border-nurture-sage/15 bg-white/90 p-4 shadow-sm backdrop-blur-sm sm:p-5"
  >
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-nurture-sage-dark">
      Explore our services
    </p>
    <p className="mt-1 text-sm text-nurture-charcoal/65">
      Serving North, Central, and South Jersey plus NY&apos;s Lower Hudson Valley — select a service to learn more.
    </p>
    <ul className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {services.map((service) => (
        <li key={service.slug} className="shrink-0">
          <a
            href={buildServiceSectionHref(service.slug)}
            className="inline-flex rounded-full border border-nurture-sage/25 bg-nurture-cream/50 px-4 py-2 text-sm font-medium text-nurture-charcoal transition hover:border-nurture-sage/45 hover:bg-nurture-sage/10 hover:text-nurture-sage-dark"
          >
            {service.title}
          </a>
        </li>
      ))}
    </ul>
  </nav>
);

export default ServicesJumpNav;
