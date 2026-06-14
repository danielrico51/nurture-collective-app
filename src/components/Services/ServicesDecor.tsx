type ServicesDecorPlacement =
  | "hero-wash"
  | "corner-top-right"
  | "corner-bottom-left"
  | "corner-bottom-right"
  | "section-divider"
  | "edge-left"
  | "edge-right"
  | "heading-ornament"
  | "card-background"
  | "card-corner"
  | "card-icon"
  | "cta-wash"
  | "cta-wave"
  | "cta-icon";

const placementClasses: Record<ServicesDecorPlacement, string> = {
  "hero-wash":
    "pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-[0.12]",
  "corner-top-right":
    "pointer-events-none absolute right-0 top-0 hidden h-32 w-32 object-contain object-right-top opacity-50 sm:block sm:h-40 sm:w-40 lg:h-48 lg:w-48",
  "corner-bottom-left":
    "pointer-events-none absolute bottom-0 left-0 hidden h-28 w-28 object-contain object-left-bottom opacity-45 sm:block sm:h-36 sm:w-36 lg:h-44 lg:w-44",
  "corner-bottom-right":
    "pointer-events-none absolute bottom-0 right-0 hidden h-28 w-28 object-contain object-right-bottom opacity-40 lg:block lg:h-36 lg:w-36",
  "section-divider":
    "pointer-events-none absolute left-1/2 top-0 z-0 h-24 w-full max-w-3xl -translate-x-1/2 object-contain object-top opacity-30 sm:h-28",
  "edge-left":
    "pointer-events-none absolute bottom-16 left-0 top-16 hidden w-16 object-contain object-left opacity-30 xl:block xl:w-20",
  "edge-right":
    "pointer-events-none absolute bottom-20 right-0 top-20 hidden w-16 object-contain object-right opacity-25 xl:block xl:w-20",
  "heading-ornament":
    "mb-3 block h-3 w-32 max-w-full object-contain object-left opacity-75 sm:mb-4 sm:h-4 sm:w-40",
  "card-background":
    "pointer-events-none absolute inset-0 z-0 h-full w-full object-cover object-center opacity-[0.16]",
  "card-corner":
    "pointer-events-none absolute -bottom-1 -right-1 z-[1] h-[4.5rem] w-[4.5rem] object-contain object-right-bottom opacity-45 sm:h-20 sm:w-20",
  "card-icon":
    "pointer-events-none absolute right-3 top-3 z-[1] h-8 w-8 object-contain object-right-top opacity-30 sm:h-9 sm:w-9",
  "cta-wash":
    "pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-[0.18]",
  "cta-wave":
    "pointer-events-none absolute bottom-0 left-0 right-0 h-16 w-full object-cover object-bottom opacity-35 sm:h-20",
  "cta-icon": "h-7 w-7 object-contain",
};

interface ServicesDecorProps {
  src: string;
  placement: ServicesDecorPlacement;
  className?: string;
}

/** Decorative SVG with placement tuned to the design pack aspect ratios. */
const ServicesDecor = ({ src, placement, className = "" }: ServicesDecorProps) => (
  <img
    src={src}
    alt=""
    aria-hidden
    className={`${placementClasses[placement]} ${className}`.trim()}
  />
);

export default ServicesDecor;
