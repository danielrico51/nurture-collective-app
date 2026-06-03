import Breadcrumb from "@/components/Common/Breadcrumb";
import EGiftCardForm from "@/components/GiftCards/EGiftCardForm";
import { GiftCardSuccessHandler } from "@/components/GiftCards/GiftCardSuccessHandler";
import {
  giftCardFaqs,
  giftCardHowItWorks,
  giftCardsIntro,
} from "@/content/giftCards";
import { integrations } from "@/config/integrations";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gift Cards | The Nesting Place",
  description:
    "Purchase a digital eGift card for birth doula support, postpartum care, lactation, massage, and maternal wellness services at The Nesting Place.",
};

export default function GiftCardsPage() {
  return (
    <>
      <GiftCardSuccessHandler />
      <Breadcrumb pageName="Gift cards" />
      <section className="py-16">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-nurture-sage-dark">
              Give support
            </p>
            <h1 className="mt-4 font-serif text-4xl font-semibold text-nurture-charcoal sm:text-5xl">
              eGift cards for every stage of motherhood
            </h1>
            <p className="mt-6 text-lg text-nurture-charcoal/80">{giftCardsIntro}</p>
          </div>

          <div className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
            <div className="space-y-10">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-nurture-charcoal">
                  How it works
                </h2>
                <ol className="mt-6 space-y-5">
                  {giftCardHowItWorks.map((step) => (
                    <li key={step.step} className="flex gap-4">
                      <span className="font-serif text-2xl font-semibold text-nurture-sage/50">
                        {step.step}
                      </span>
                      <div>
                        <p className="font-medium text-nurture-charcoal">{step.title}</p>
                        <p className="mt-1 text-sm text-nurture-charcoal/70">
                          {step.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-2xl border border-nurture-sage/15 bg-nurture-sage/5 p-6">
                <h3 className="font-serif text-lg font-semibold text-nurture-charcoal">
                  Perfect for
                </h3>
                <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-nurture-charcoal/75">
                  <li>Baby showers and sip &amp; sees</li>
                  <li>Postpartum support for a friend or family member</li>
                  <li>Grandparents gifting doula or lactation care</li>
                  <li>Employer or team gifts for expecting parents</li>
                </ul>
              </div>

              <div>
                <h2 className="font-serif text-2xl font-semibold text-nurture-charcoal">
                  Questions
                </h2>
                <dl className="mt-6 space-y-5">
                  {giftCardFaqs.map((item) => (
                    <div key={item.q}>
                      <dt className="font-medium text-nurture-charcoal">{item.q}</dt>
                      <dd className="mt-2 text-sm leading-relaxed text-nurture-charcoal/70">
                        {item.a}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <p className="text-sm text-nurture-charcoal/65">
                Need help choosing an amount?{" "}
                <Link href="/contact" className="font-medium text-nurture-sage-dark hover:underline">
                  Contact our team
                </Link>{" "}
                or email{" "}
                <a
                  href={`mailto:${integrations.contactEmail}`}
                  className="font-medium text-nurture-sage-dark hover:underline"
                >
                  {integrations.contactEmail}
                </a>
                .
              </p>
            </div>

            <EGiftCardForm />
          </div>
        </div>
      </section>
    </>
  );
}
