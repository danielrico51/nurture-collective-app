import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { brands } from "@/content/site";

/** Horizontal wordmark (baby + The Nesting Place). */
const WORDMARK_WIDTH = 1024;
const WORDMARK_HEIGHT = 433;

/** Legacy stacked logo with tagline block. */
const LEGACY_LOGO_WIDTH = 760;
const LEGACY_LOGO_HEIGHT = 630;

const VARIANT_MAX_CLASS = {
  header: "max-h-10 w-auto sm:max-h-11",
  /** Header banner wordmark — scales with viewport (+50% vs prior sizing) */
  wordmark:
    "h-[clamp(4.125rem,6.75vw+1.875rem,6rem)] w-auto max-h-24 max-w-[min(58vw,30rem)] object-contain",
  hero: "h-[clamp(5rem,12vw,9rem)] w-auto max-w-[min(100%,36rem)] object-contain",
  footer: "max-h-14 w-auto sm:max-h-16 md:max-h-[4.5rem]",
  auth: "max-h-16 w-auto sm:max-h-[4.5rem]",
  about: "max-h-32 w-auto",
  legacy: "max-h-36 w-auto sm:max-h-40 md:max-h-44",
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
  const useWordmark =
    variant === "header" ||
    variant === "wordmark" ||
    variant === "hero" ||
    variant === "footer" ||
    variant === "auth";

  let content: ReactNode;

  if (compact) {
    content = (
      <span className="inline-flex items-center gap-2.5 sm:gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center sm:h-14 sm:w-14">
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
            className={`block font-serif text-sm font-semibold text-nurture-charcoal sm:text-base ${nameClassName}`.trim()}
          >
            <span className="text-nurture-charcoal">The </span>
            <span className="text-nurture-sage-dark">Nesting</span>
            <span className="text-nurture-charcoal"> Place</span>
          </span>
        </span>
      </span>
    );
  } else if (useWordmark) {
    const image = (
      <Image
        src={brands.nestingPlace.wordmarkSrc}
        alt={`${brands.nestingPlace.name} — ${brands.nestingPlace.tagline}`}
        width={WORDMARK_WIDTH}
        height={WORDMARK_HEIGHT}
        priority={priority}
        className={`object-contain ${VARIANT_MAX_CLASS[variant === "header" ? "wordmark" : variant]} ${className}`.trim()}
      />
    );

    content = showName ? (
      <span className="inline-flex items-center gap-3">
        {image}
        <span
          className={`font-serif font-semibold leading-tight text-nurture-sage-dark ${nameClassName}`.trim()}
        >
          {(nameVariant === "nurtureCollective"
            ? brands.nurtureCollective
            : brands.nestingPlace
          ).name}
        </span>
      </span>
    ) : (
      image
    );
  } else {
    const brand =
      nameVariant === "nurtureCollective"
        ? brands.nurtureCollective
        : brands.nestingPlace;

    const image = (
      <Image
        src="/branding/nesting-place-logo.png"
        alt={`${brands.nestingPlace.name} — ${brands.nestingPlace.tagline}`}
        width={LEGACY_LOGO_WIDTH}
        height={LEGACY_LOGO_HEIGHT}
        priority={priority}
        className={`h-auto w-auto max-w-none object-contain ${VARIANT_MAX_CLASS.legacy} ${className}`.trim()}
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
      <Link href="/" className="inline-flex shrink-0 items-center transition hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
};

export default NestingPlaceLogo;
