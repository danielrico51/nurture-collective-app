import Breadcrumb from "@/components/Common/Breadcrumb";
import ContactOptions from "@/components/Common/ContactOptions";
import SectionTitle from "@/components/Common/SectionTitle";
import EmployerBenefitPlatformCard from "@/components/Benefits/EmployerBenefitPlatformCard";
import { buildCareStartHref } from "@/config/carePaths";
import {
  benefitSections,
  benefitsIntro,
} from "@/content/benefits";
import {
  employerBenefitPlatforms,
  employerBenefitsPageIntro,
  employerBenefitsPageLead,
  howEmployerBenefitsWork,
  nestingPlaceBenefitsRole,
} from "@/content/employerBenefitPlatforms";
import { brands } from "@/content/site";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Benefits & Insurance | The Nesting Place",
  description:
    "Learn how employer benefits through Carrot, ProgenyHealth, and Maven Clinic may help cover doula and postpartum care — and how The Nesting Place supports your reimbursement journey.",
};

export default function BenefitsAndInsurancePage() {
  const otherBenefitSections = benefitSections.filter(
    (section) => section.id !== "employee-benefits"
  );

  return (
    <>
      <Breadcrumb pageName="Benefits & insurance" />
      <section className="py-16">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-nurture-sage-dark">
              Paying for care
            </p>
            <h1 className="mt-4 font-serif text-4xl font-semibold text-nurture-charcoal sm:text-5xl">
              Benefits & insurance
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-nurture-charcoal/80">
              {benefitsIntro}
            </p>
          </div>

          <div className="mx-auto mt-20 max-w-3xl rounded-2xl border border-nurture-sage/20 bg-nurture-sage/5 p-8">
            <h2 className="font-serif text-2xl font-semibold text-nurture-charcoal">
              Employer family benefits
            </h2>
            <p className="mt-4 text-nurture-charcoal/80">{employerBenefitsPageIntro}</p>
            <p className="mt-4 text-nurture-charcoal/80">{employerBenefitsPageLead}</p>
          </div>

          <div className="mt-16">
            <SectionTitle
              title="How employer benefits usually work"
              subtitle="A simple overview before you compare platforms."
            />
            <ol className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2">
              {howEmployerBenefitsWork.map((step, index) => (
                <li
                  key={step.title}
                  className="rounded-2xl border border-nurture-sage/15 bg-white p-6 shadow-sm"
                >
                  <span className="font-serif text-2xl font-semibold text-nurture-sage/50">
                    {index + 1}
                  </span>
                  <p className="mt-3 font-semibold text-nurture-charcoal">{step.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-nurture-charcoal/70">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-20">
            <SectionTitle
              title="Platforms your employer may use"
              subtitle="Each company designs its own package — always confirm coverage in your member portal or with HR."
            />
            <div className="mt-12 space-y-8">
              {employerBenefitPlatforms.map((platform) => (
                <EmployerBenefitPlatformCard key={platform.id} platform={platform} />
              ))}
            </div>
          </div>

          <div className="mx-auto mt-20 max-w-3xl rounded-2xl border border-nurture-blush/40 bg-white p-8 shadow-sm">
            <h2 className="font-serif text-2xl font-semibold text-nurture-charcoal">
              {nestingPlaceBenefitsRole.title}
            </h2>
            <div className="mt-4 space-y-4 text-nurture-charcoal/80">
              {nestingPlaceBenefitsRole.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </div>
            <ul className="mt-6 space-y-2">
              {nestingPlaceBenefitsRole.checklist.map((item) => (
                <li
                  key={item}
                  className="flex gap-2 text-sm text-nurture-charcoal/75"
                >
                  <span className="mt-1 text-nurture-sage-dark" aria-hidden>
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact?topic=benefits"
                className="inline-flex justify-center rounded-full bg-nurture-sage px-6 py-3 text-sm font-semibold text-white hover:bg-nurture-sage-dark"
              >
                Ask about your benefits
              </Link>
              <Link
                href={buildCareStartHref()}
                className="inline-flex justify-center rounded-full border border-nurture-sage px-6 py-3 text-sm font-semibold text-nurture-sage-dark hover:bg-nurture-sage/10"
              >
                Request support
              </Link>
            </div>
          </div>

          <div className="mt-20">
            <SectionTitle
              title="Other ways to pay for care"
              subtitle={`Additional options beyond employer platforms at ${brands.nestingPlace.name}.`}
            />
            <div className="mt-12 space-y-8">
              {otherBenefitSections.map((section) => (
                <article
                  key={section.id}
                  id={section.id}
                  className="rounded-2xl border border-nurture-sage/15 bg-white p-8 shadow-sm"
                >
                  <h3 className="font-serif text-xl font-semibold text-nurture-charcoal">
                    {section.title}
                  </h3>
                  <div className="mt-4 space-y-3 text-sm leading-relaxed text-nurture-charcoal/75">
                    {section.body.map((paragraph) => (
                      <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                    ))}
                  </div>
                  {section.highlights?.length ? (
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {section.highlights.map((item) => (
                        <li
                          key={item}
                          className="rounded-full bg-nurture-sage/10 px-3 py-1 text-xs font-medium text-nurture-sage-dark"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              ))}
            </div>
          </div>

          <div className="mt-16">
            <SectionTitle
              title="Questions about coverage?"
              subtitle="Tell us which benefit platform you have — we will help you understand next steps."
            />
            <div className="mt-10">
              <ContactOptions
                variant="contact"
                formHref="/contact?audience=mom"
                whatsappMessage="Hi! I have a question about using my employer benefits with The Nesting Place."
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
