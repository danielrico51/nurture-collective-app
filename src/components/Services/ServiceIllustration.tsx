import {
  serviceIllustrationAlt,
  serviceIllustrationSrc,
} from "@/config/serviceIllustrations";
import type { ServiceSlug } from "@/content/site";
import Image from "next/image";

/** Source illustrations are ~3:2 landscape (1024×682). */
export const SERVICE_ILLUSTRATION_ASPECT = "aspect-[3/2]";

interface ServiceIllustrationProps {
  slug: ServiceSlug;
  className?: string;
  variant?: "card" | "inline";
}

const ServiceIllustration = ({
  slug,
  className = "",
  variant = "inline",
}: ServiceIllustrationProps) => {
  const src = serviceIllustrationSrc[slug];

  if (!src) {
    return null;
  }

  const isCard = variant === "card";

  return (
    <div
      className={`relative w-full overflow-hidden bg-nurture-cream/50 ${SERVICE_ILLUSTRATION_ASPECT} ${
        isCard
          ? "rounded-[1.25rem] shadow-sm ring-1 ring-nurture-sage/10"
          : "rounded-[1.35rem] bg-nurture-cream/70"
      } ${className}`}
    >
      <Image
        src={src}
        alt={serviceIllustrationAlt[slug] ?? ""}
        fill
        className={
          isCard
            ? "object-cover object-center"
            : "object-contain object-center p-1 sm:p-1.5"
        }
        sizes={
          isCard
            ? "(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 400px"
            : "(max-width: 640px) 42vw, 180px"
        }
      />
    </div>
  );
};

export default ServiceIllustration;
