import Breadcrumb from "@/components/Common/Breadcrumb";
import ContactOptions from "@/components/Common/ContactOptions";
import MarketingSection from "@/components/Common/MarketingSection";
import PageIntroWithImage from "@/components/Common/PageIntroWithImage";
import SectionTitle from "@/components/Common/SectionTitle";
import { pageArtwork } from "@/config/pageArtwork";
import { MARKETING_CREAM } from "@/config/marketingDesign";import {
  benefitSections,
  benefitsEmployerNote,
  benefitsIntro,
} from "@/content/benefits";
import { buildPageMetadata } from "@/config/seo";
import { brands } from "@/content/site";
import type { Metadata } from "next";

export const metadata: Metadata = buildPageMetadata({
  title: "Benefits & Insurance for Doula & Postpartum Support",
  description:
    "Learn how to pay for birth doula and postpartum support through employer benefits, insurance reimbursement, and FSA/HSA at The Nesting Place in NJ, NY, CT, and PA.",
  path: "/benefits-and-insurance",
  keywords: [
    "doula insurance reimbursement",
    "FSA HSA birth doula",
    "Carrot Maven doula benefits",
  ],
});

export default function BenefitsAndInsurancePage() {
  return (
    <>
      <Breadcrumb pageName="Benefits & insurance" />
      <section className="py-16">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <PageIntroWithImage
            imageSrc={pageArtwork.benefitsFamily.src}
            imageAlt={pageArtwork.benefitsFamily.alt}
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-nurture-sage-dark">
              Paying for support
            </p>
            <h1 className="mt-4 font-serif text-4xl font-semibold text-nurture-charcoal sm:text-5xl">
              Benefits & insurance
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-nurture-charcoal/80">
              {benefitsIntro}
            </p>
          </PageIntroWithImage>

          <div className="mx-auto mt-12 max-w-3xl space-y-8">            <article className="rounded-2xl border border-nurture-sage/15 bg-white p-8 shadow-sm">
              <h3 className="font-serif text-xl font-semibold text-nurture-charcoal">
                Employer family benefits
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-nurture-charcoal/75">
                {benefitsEmployerNote}
              </p>
            </article>

            {benefitSections.map((section) => (
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
              </article>
            ))}
          </div>

          <div className="mx-auto mt-16 max-w-3xl rounded-2xl border border-nurture-sage/15 bg-white p-8 text-center shadow-sm">
            <p className="text-nurture-charcoal/80">
              Questions about your plan? Tell us which benefit platform or insurer
              you have — we&apos;ll help you understand typical next steps for{" "}
              {brands.nestingPlace.name} services.
            </p>
          </div>

          <MarketingSection
            waves="top"
            waveTopFill={MARKETING_CREAM}
            className="bg-white pb-14 sm:pb-16"
          >
            <SectionTitle
              title="Talk with our team"
              subtitle="We'll answer questions about coverage and documentation."
            />
            <div className="mt-8">
              <ContactOptions
                variant="contact"
                formHref="/contact?topic=benefits&audience=mom"
                whatsappMessage="Hi! I have a question about using my benefits with The Nesting Place."
              />
            </div>
          </MarketingSection>
      </div>
    </section>
    </>
  );
}
