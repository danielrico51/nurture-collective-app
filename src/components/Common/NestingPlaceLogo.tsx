import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { brands } from "@/content/site";

/** Intrinsic dimensions of nesting-place-logo.png (includes transparent padding). */
const LOGO_WIDTH = 760;
const LOGO_HEIGHT = 630;

const VARIANT_MAX_CLASS = {
  header: "max-h-11 w-auto sm:max-h-12",
  hero: "max-h-36 w-auto sm:max-h-40 md:max-h-44",
  footer: "max-h-[88px] w-auto",
  auth: "max-h-28 w-auto sm:max-h-32",
  about: "max-h-32 w-auto",
} as const;

export type NestingPlaceLogoVariant = keyof typeof VARIANT_MAX_CLASS;

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
  nameVariant = "nestingPlace",
  nameClassName = "",
}: NestingPlaceLogoProps) => {
  const markBox = variant === "header" ? 44 : 52;

  let content: ReactNode;

  if (compact) {
    content = (
      <span className="inline-flex items-center gap-3">
        <span
          className="flex shrink-0 items-center justify-center rounded-md p-1"
          style={{ width: markBox, height: markBox }}
        >
          <Image
            src={brands.nestingPlace.markSrc}
            alt=""
            aria-hidden
            width={64}
            height={64}
            priority={priority}
            className="h-full w-full object-contain"
          />
        </span>
        <span className="min-w-0 leading-tight">
          <span
            className={`block font-serif font-semibold text-nurture-sage-dark ${nameClassName}`.trim()}
          >
            {brands.nestingPlace.name}
          </span>
          <span className="mt-0.5 block text-xs font-medium text-nurture-charcoal/65">
            {brands.nestingPlace.byline}
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
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        priority={priority}
        className={`h-auto w-auto max-w-none object-contain ${VARIANT_MAX_CLASS[variant]} ${className}`.trim()}
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
