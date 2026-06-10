import {
  serviceIllustrationAlt,
  serviceIllustrationSrc,
} from "@/config/serviceIllustrations";
import type { ServiceSlug } from "@/content/site";
import Image from "next/image";

/**
 * Card art frame — square-ish to match the services mockup (~40% of card width).
 * Source files may be 1024×708; they scale with object-contain inside this frame.
 */
export const SERVICE_ILLUSTRATION_ASPECT = "aspect-square";

interface ServiceIllustrationProps {
  slug: ServiceSlug;
  className?: string;
}

const ServiceIllustration = ({ slug, className = "" }: ServiceIllustrationProps) => {
  const src = serviceIllustrationSrc[slug];

  if (!src) {
    return null;
  }

  return (
    <div
      className={`relative w-full overflow-hidden rounded-[1.35rem] bg-nurture-cream/70 ${SERVICE_ILLUSTRATION_ASPECT} ${className}`}
    >
      <Image
        src={src}
        alt={serviceIllustrationAlt[slug] ?? ""}
        fill
        className="object-contain object-center p-0.5 sm:p-1"
        sizes="(max-width: 640px) 38vw, 168px"
      />
    </div>
  );
};

export default ServiceIllustration;
