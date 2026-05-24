"use client";

import { useState } from "react";
import SectionTitle from "@/components/Common/SectionTitle";

const faqs = [
  {
    q: "Is The Nurture Collective medical care?",
    a: "No. We provide concierge and wellness support. We do not diagnose, treat, or replace care from your OB, midwife, or pediatrician.",
  },
  {
    q: "When should I join?",
    a: "Whenever it feels right — during pregnancy, right after birth, or months into motherhood. We tailor support to your stage.",
  },
  {
    q: "What areas do you serve?",
    a: "We're launching with virtual concierge support first, with in-home services expanding by region. Contact us to ask about your area.",
  },
  {
    q: "How do memberships work?",
    a: "Flexible plans are coming soon. Create an account today to be first in line when we open enrollment.",
  },
];

const Faq = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-20">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <SectionTitle title="Common questions" />
        <div className="mx-auto mt-10 max-w-2xl divide-y divide-nurture-sage/15">
          {faqs.map((faq, index) => (
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

export default Faq;
