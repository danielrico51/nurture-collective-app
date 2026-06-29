"use client";

import {
  ScrollRevealHeading,
  type ScrollRevealHeadingTag,
} from "@/components/Common/ScrollRevealHeading.client";
import type { ScrollRevealVariant } from "@/lib/motion/scrollReveal";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
  revealVariant?: ScrollRevealVariant;
  as?: ScrollRevealHeadingTag;
  titleClassName?: string;
}

const SectionTitle = ({
  title,
  subtitle,
  centered = true,
  revealVariant = "soft",
  as = "h2",
  titleClassName,
}: SectionTitleProps) => {
  const headingClassName =
    titleClassName ??
    "font-serif text-[clamp(1.75rem,3.5vw+0.5rem,2.25rem)] font-semibold text-nurture-charcoal sm:text-4xl";

  return (
    <div className={centered ? "text-center" : ""}>
      <ScrollRevealHeading
        as={as}
        variant={revealVariant}
        className={headingClassName}
      >
        {title}
      </ScrollRevealHeading>
      {subtitle ? (
        <p className="mx-auto mt-3 max-w-2xl text-base text-nurture-charcoal/70 sm:mt-4 sm:text-lg">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
};

export default SectionTitle;
