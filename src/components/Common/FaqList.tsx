"use client";

import { useState } from "react";
import SectionTitle from "@/components/Common/SectionTitle";

interface FaqItem {
  q: string;
  a: string;
}

interface FaqListProps {
  title?: string;
  items: readonly FaqItem[];
}

const FaqList = ({ title = "Common questions", items }: FaqListProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-20">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <SectionTitle title={title} />
        <div className="mx-auto mt-10 max-w-2xl divide-y divide-nurture-sage/15">
          {items.map((faq, index) => (
            <div key={faq.q} className="py-4">
              <button
                type="button"
                className="flex w-full items-center justify-between text-left font-medium text-nurture-charcoal"
                onClick={() =>
                  setOpenIndex(openIndex === index ? null : index)
                }
              >
                {faq.q}
                <span className="text-nurture-sage-dark">
                  {openIndex === index ? "−" : "+"}
                </span>
              </button>
              {openIndex === index && (
                <p className="mt-3 text-sm text-nurture-charcoal/70">{faq.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FaqList;
