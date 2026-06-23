"use client";

import { useState } from "react";
import SectionTitle from "@/components/Common/SectionTitle";
import SectionWaveEdges, {
  FOOTER_WAVE_OVERLAP_CLASS,
} from "@/components/Common/SectionWaveEdges";
import { MARKETING_CREAM } from "@/config/marketingDesign";

interface FaqItem {
  q: string;
  a: string;
}

interface FaqListProps {
  title?: string;
  items: readonly FaqItem[];
  className?: string;
  organicWaves?: boolean;
  /** Fill for the top wave — match the section background above. */
  waveTopFill?: string;
}

const FaqList = ({
  title = "Common questions",
  items,
  className = "",
  organicWaves = false,
  waveTopFill = MARKETING_CREAM,
}: FaqListProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const sectionClassName = organicWaves
    ? `relative overflow-hidden bg-nurture-cream ${FOOTER_WAVE_OVERLAP_CLASS} pb-6 pt-20 sm:pb-8 sm:pt-24 ${className}`
    : `py-12 sm:py-14 ${className}`;

  return (
    <section className={sectionClassName}>
      {organicWaves && <SectionWaveEdges topOnly topFill={waveTopFill} />}
      <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <SectionTitle title={title} revealVariant="gentle" />
        <div className="mx-auto mt-8 max-w-2xl divide-y divide-nurture-sage/15">
          {items.map((faq, index) => {
            const isOpen = openIndex === index;
            const answerId = `faq-answer-${index}`;

            return (
              <div key={faq.q} className="py-3">
                <button
                  type="button"
                  className="flex w-full items-center justify-between text-left font-medium text-nurture-charcoal"
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  {faq.q}
                  <span className="text-nurture-grape">{isOpen ? "−" : "+"}</span>
                </button>
                <div
                  id={answerId}
                  aria-hidden={!isOpen}
                  className={
                    isOpen
                      ? "mt-2 text-sm text-nurture-charcoal/70"
                      : "sr-only text-sm text-nurture-charcoal/70"
                  }
                >
                  {faq.a}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FaqList;
