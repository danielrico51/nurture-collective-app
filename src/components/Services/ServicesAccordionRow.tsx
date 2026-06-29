"use client";

import type { ReactNode } from "react";

interface ServicesAccordionRowProps {
  children: ReactNode;
  className?: string;
  /** Center a lone card so it aligns with the three-up grid above. */
  centerSingle?: boolean;
}

/** Horizontal flex row for expanding service cards on md+; stacks on mobile. */
const ServicesAccordionRow = ({
  children,
  className = "",
  centerSingle = false,
}: ServicesAccordionRowProps) => (
  <div
    className={`flex w-full flex-col gap-4 md:flex-row md:items-stretch ${
      centerSingle ? "md:justify-center" : ""
    } ${className}`.trim()}
  >
    {children}
  </div>
);

export default ServicesAccordionRow;
