import Breadcrumb from "@/components/Common/Breadcrumb";
import SectionTitle from "@/components/Common/SectionTitle";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | The Nurture Collective",
  description:
    "Learn about our mission to support mothers through pre- and postpartum with personalized concierge care.",
};

export default function AboutPage() {
  return (
    <>
      <Breadcrumb pageName="About us" />
      <section className="py-16">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <SectionTitle
              title="Motherhood deserves more than survival mode"
              subtitle="We started The Nurture Collective because every mother deserves a team in her corner."
              centered={false}
            />
            <div className="mt-10 space-y-6 text-nurture-charcoal/80">
              <p>
                Becoming a mother — whether for the first time or again — is one
                of life&apos;s most profound transitions. Yet too often, women
                navigate pregnancy, birth, and postpartum with fragmented
                resources, little rest, and the quiet expectation that they
                should simply figure it out.
              </p>
              <p>
                The Nurture Collective is changing that. We&apos;re building a
                mom concierge service rooted in pre- and postpartum support:
                practical help when you&apos;re exhausted, emotional care when
                you feel alone, and a trusted coordinator who knows your story.
              </p>
              <p>
                We&apos;re not a medical practice. We work alongside your
                healthcare team to fill the gaps between appointments — the
                meals, the planning, the check-ins, the small things that make
                a big difference.
              </p>
            </div>

            <div className="mt-12 rounded-2xl border border-nurture-sage/20 bg-white p-8">
              <h3 className="font-serif text-xl font-semibold">Who we serve</h3>
              <ul className="mt-4 list-inside list-disc space-y-2 text-nurture-charcoal/80">
                <li>Expecting parents preparing for birth and baby</li>
                <li>New mothers in the first weeks and months postpartum</li>
                <li>Families navigating feeding, sleep, and recovery challenges</li>
                <li>Anyone who wants a calmer, more supported path through motherhood</li>
              </ul>
            </div>

            <div className="mt-10">
              <Link
                href="/contact"
                className="rounded-full bg-nurture-sage px-6 py-3 text-sm font-semibold text-white hover:bg-nurture-sage-dark"
              >
                Get in touch
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
