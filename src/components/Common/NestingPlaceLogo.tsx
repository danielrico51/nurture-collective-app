import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { brands } from "@/content/site";

const LOGO_ASPECT = 680 / 564;

const VARIANTS = {
  header: 52,
  footer: 88,
  auth: 56,
  about: 128,
} as const;

export type NestingPlaceLogoVariant = keyof typeof VARIANTS;

interface NestingPlaceLogoProps {
  variant?: NestingPlaceLogoVariant;
  linked?: boolean;
  priority?: boolean;
  className?: string;
  /** Compact baby mark + brand names (header-friendly) */
  compact?: boolean;
  /** Show a single brand name beside the logo */
  showName?: boolean;
  nameVariant?: "nestingPlace" | "nurtureCollective";
  nameClassName?: string;
}

const NestingPlaceLogo = ({
  variant = "header",
  linked = true,
  priority = false,
  className = "",
  compact = false,
  showName = false,
  nameVariant = "nurtureCollective",
  nameClassName = "",
}: NestingPlaceLogoProps) => {
  const height = VARIANTS[variant];
  const width = Math.round(height * LOGO_ASPECT);

  let content: ReactNode;

  if (compact) {
    const markSize = variant === "header" ? 40 : 48;
    content = (
      <span className="inline-flex items-center gap-3">
        <Image
          src={brands.nestingPlace.markSrc}
          alt=""
          aria-hidden
          width={markSize}
          height={markSize}
          priority={priority}
          className="rounded-md object-contain"
        />
        <span className="min-w-0 leading-tight">
          <span
            className={`block font-serif font-semibold text-nurture-sage-dark ${nameClassName}`.trim()}
          >
            {brands.nurtureCollective.name}
          </span>
          <span className="mt-0.5 block text-xs font-medium text-nurture-charcoal/65">
            {brands.nestingPlace.name}
          </span>
        </span>
      </span>
    );
  } else {
    const brand =
      nameVariant === "nurtureCollective"
        ? brands.nurtureCollective
        : brands.nestingPlace;

    const image = (
      <Image
        src={brands.nestingPlace.logoSrc}
        alt={`${brands.nestingPlace.name} — ${brands.nestingPlace.tagline}`}
        width={width}
        height={height}
        priority={priority}
        className={`object-contain ${className}`.trim()}
      />
    );

    content = showName ? (
      <span className="inline-flex items-center gap-3">
        {image}
        <span
          className={`font-serif font-semibold leading-tight text-nurture-sage-dark ${nameClassName}`.trim()}
        >
          {brand.name}
        </span>
      </span>
    ) : (
      image
    );
  }

  if (linked) {
    return (
      <Link href="/" className="inline-flex shrink-0 items-center">
        {content}
      </Link>
    );
  }

  return content;
};

export default NestingPlaceLogo;
