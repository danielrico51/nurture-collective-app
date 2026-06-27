import Image from "next/image";

export type HeroBlendVariant = "default" | "strong";

interface HeroBlendImageProps {
  src: string;
  alt: string;
  priority?: boolean;
  blend?: HeroBlendVariant;
  /** Background behind strong-blend SVGs (matches the section surface). */
  blendSurface?: "cream" | "white";
  className?: string;
}

const blendClassName: Record<HeroBlendVariant, string> = {
  default: "hero-image-blend",
  strong: "hero-image-blend hero-image-blend-strong",
};

const HeroBlendImage = ({
  src,
  alt,
  priority = false,
  blend = "default",
  blendSurface = "cream",
  className = "",
}: HeroBlendImageProps) => {
  const isSvg = src.endsWith(".svg");
  const strongSurfaceClass =
    blendSurface === "white" ? "bg-white" : "bg-nurture-cream";

  return (
    <div
      className={`relative z-0 mx-auto w-full max-w-md lg:mx-0 lg:ml-auto lg:max-w-none lg:-translate-x-[6%] ${className}`}
    >
      <div
        aria-hidden
        className="absolute inset-6 rounded-[2.75rem] bg-nurture-rose-light/45 blur-3xl"
      />
      <div className="relative px-2 py-3 sm:px-4 sm:py-4">
        <div
          className={`${blendClassName[blend]} overflow-hidden rounded-3xl${
            blend === "strong" ? ` ${strongSurfaceClass}` : ""
          }`}
        >
          <Image
            src={src}
            alt={alt}
            width={1536}
            height={1024}
            unoptimized={isSvg}
            className="h-auto w-full object-contain"
            priority={priority}
          />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-2 rounded-3xl bg-gradient-to-r from-nurture-rose-light/45 via-transparent to-nurture-blush/30 sm:inset-4"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-2 rounded-3xl bg-gradient-to-b from-nurture-rose-light/30 via-transparent to-nurture-cream/50 sm:inset-4"
        />
      </div>
    </div>
  );
};

export default HeroBlendImage;
