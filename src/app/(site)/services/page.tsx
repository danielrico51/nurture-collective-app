import Breadcrumb from "@/components/Common/Breadcrumb";
import SectionTitle from "@/components/Common/SectionTitle";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services | The Nurture Collective",
  description:
    "Prepartum, postpartum, lactation, emotional wellness, and household concierge support for mothers.",
};

const services = [
  {
    title: "Prenatal concierge",
    description:
      "Birth plan support, nursery coordination, vendor referrals, and preparing your support network before baby arrives.",
    tag: "Prepartum",
  },
  {
    title: "Postpartum recovery",
    description:
      "Hands-on help with rest, recovery routines, visitor boundaries, and easing the load in the fourth trimester.",
    tag: "Postpartum",
  },
  {
    title: "Lactation & feeding support",
    description:
      "Resources, specialist referrals, and practical setup for breastfeeding, pumping, or combination feeding.",
    tag: "Feeding",
  },
  {
    title: "Emotional wellness",
    description:
      "Regular check-ins, mood tracking prompts, and warm referrals when you need professional mental health care.",
    tag: "Wellness",
  },
  {
    title: "Household & practical help",
    description:
      "Meal coordination, errands, sibling transitions, and the everyday tasks that pile up when you're depleted.",
    tag: "Practical",
  },
  {
    title: "Custom care plans",
    description:
      "A concierge coordinator who learns your family and builds ongoing support around your goals.",
    tag: "Membership",
  },
];

export default function ServicesPage() {
  return (
    <>
      <Breadcrumb pageName="Services" />
      <section className="py-16">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="Concierge care, built around you"
            subtitle="Every family is different. We design support that fits your season — not a checklist."
          />
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <article
                key={service.title}
                className="flex flex-col rounded-2xl border border-nurture-sage/15 bg-white p-8 shadow-sm"
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-nurture-sage-dark">
                  {service.tag}
                </span>
                <h2 className="mt-3 font-serif text-xl font-semibold">
                  {service.title}
                </h2>
                <p className="mt-3 flex-1 text-sm text-nurture-charcoal/70">
                  {service.description}
                </p>
                <p className="mt-4 text-xs font-medium text-nurture-sage-dark">
                  Enrollment opening soon
                </p>
              </article>
            ))}
          </div>
          <div className="mt-16 rounded-2xl bg-nurture-blush/20 p-8 text-center">
            <p className="text-sm text-nurture-charcoal/80">
              Ready to be first in line? Create your account and we&apos;ll
              reach out when your area opens.
            </p>
            <Link
              href="/signup"
              className="mt-4 inline-block rounded-full bg-nurture-sage px-6 py-3 text-sm font-semibold text-white hover:bg-nurture-sage-dark"
            >
              Join the waitlist
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
