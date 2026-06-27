import type { ServiceSlug } from "@/content/site";

interface ServiceIconProps {
  slug: ServiceSlug;
  className?: string;
}

const iconPaths: Record<ServiceSlug, React.ReactNode> = {
  "birth-doula": (
    <>
      <circle cx="12" cy="8" r="3" />
      <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M4 12h2M18 12h2" strokeLinecap="round" />
    </>
  ),
  "overnight-newborn": (
    <>
      <path d="M12 3v2M8 5l1 1.7M16 5l-1 1.7" strokeLinecap="round" />
      <circle cx="12" cy="14" r="5" />
      <path d="M10 14h4M12 12v4" strokeLinecap="round" />
    </>
  ),
  "postpartum-care": (
    <>
      <path d="M12 4c-2 0-3.5 1.5-3.5 3.5S10 11 12 11s3.5-1.5 3.5-3.5S14 4 12 4z" />
      <path d="M7 20c0-3 2.2-5 5-5s5 2 5 5" />
      <path d="M16 8l2 2M8 8L6 10" strokeLinecap="round" />
    </>
  ),
  lactation: (
    <>
      <circle cx="12" cy="10" r="4" />
      <path d="M8 18c0-2.2 1.8-4 4-4s4 1.8 4 4" />
      <path d="M12 6v2M9 7.5l1 .5M15 7.5l-1 .5" strokeLinecap="round" />
    </>
  ),
  "prenatal-massage": (
    <>
      <path d="M6 14c2-3 4-4 6-4s4 1 6 4" strokeLinecap="round" />
      <circle cx="12" cy="8" r="3" />
      <path d="M4 12c1-2 3-3 4-3M20 12c-1-2-3-3-4-3" strokeLinecap="round" />
    </>
  ),
  "postpartum-massage": (
    <>
      <path d="M5 15c2-2.5 4.5-3.5 7-3.5s5 1 7 3.5" strokeLinecap="round" />
      <circle cx="12" cy="7" r="3" />
      <path d="M9 10l-1 2M15 10l1 2" strokeLinecap="round" />
    </>
  ),
  "birth-photography": (
    <>
      <rect x="4" y="7" width="16" height="12" rx="2" />
      <circle cx="12" cy="13" r="3" />
      <path d="M9 7l1.5-2h3L15 7" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "childbirth-education": (
    <>
      <path d="M6 5h12v14H6z" />
      <path d="M9 9h6M9 13h4" strokeLinecap="round" />
      <path d="M12 5v-2" strokeLinecap="round" />
    </>
  ),
  "placenta-encapsulation": (
    <>
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 6v1M12 17v1M6 12h1M17 12h1" strokeLinecap="round" />
    </>
  ),
};

const ServiceIcon = ({ slug, className = "h-6 w-6" }: ServiceIconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    className={className}
    aria-hidden
  >
    {iconPaths[slug]}
  </svg>
);

export default ServiceIcon;
