import {
  serviceIllustrationAlt,
  serviceIllustrationSrc,
} from "@/config/serviceIllustrations";
import type { ServiceSlug } from "@/content/site";
import Image from "next/image";

/** All service art exports share this canvas (1024×708). */
export const SERVICE_ILLUSTRATION_ASPECT = "aspect-[1024/708]";

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
        className="object-contain object-center p-1.5 sm:p-2"
        sizes="(max-width: 640px) 112px, 128px"
      />
    </div>
  );
};

export default ServiceIllustration;
