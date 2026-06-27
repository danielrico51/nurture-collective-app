import Breadcrumb from "@/components/Common/Breadcrumb";
import ContactOptions from "@/components/Common/ContactOptions";
import MarketingSection from "@/components/Common/MarketingSection";
import PageIntroWithImage from "@/components/Common/PageIntroWithImage";
import SectionTitle from "@/components/Common/SectionTitle";
import { pageArtwork } from "@/config/pageArtwork";
import {
  MARKETING_CREAM,
  MARKETING_OAK_SURFACE,
} from "@/config/marketingDesign";
import { buildPageMetadata } from "@/config/seo";
import {
  benefitSections,
  benefitsEmployerNote,
  benefitsIntro,
} from "@/content/benefits";
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

const benefitCardClassName =
  "rounded-2xl border border-nurture-lilac/25 bg-nurture-cream p-8 shadow-sm";

export default function BenefitsAndInsurancePage() {
  return (
    <div className="overflow-x-hidden bg-nurture-cream">
      <Breadcrumb pageName="Benefits & insurance" />

      <section className="py-12 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <PageIntroWithImage
            imageSrc={pageArtwork.benefitsFamily.src}
            imageAlt={pageArtwork.benefitsFamily.alt}
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-nurture-grape">
              Paying for support
            </p>
            <h1 className="mt-4 font-serif text-4xl font-semibold text-nurture-charcoal sm:text-5xl">
              Benefits & insurance
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-nurture-charcoal/80">
              {benefitsIntro}
            </p>
          </PageIntroWithImage>
        </div>
      </section>

      <section
        className="py-12 sm:py-14 lg:py-16"
        style={{ backgroundColor: MARKETING_OAK_SURFACE }}
      >
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl space-y-8">
            <article className={benefitCardClassName}>
              <h2 className="font-serif text-xl font-semibold text-nurture-charcoal sm:text-2xl">
                Employer family benefits
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-nurture-charcoal/75 sm:text-base">
                {benefitsEmployerNote}
              </p>
            </article>

            {benefitSections.map((section) => (
              <article
                key={section.id}
                id={section.id}
                className={benefitCardClassName}
              >
                <h2 className="font-serif text-xl font-semibold text-nurture-charcoal sm:text-2xl">
                  {section.title}
                </h2>
                <div className="mt-4 space-y-3 text-sm leading-relaxed text-nurture-charcoal/75 sm:text-base">
                  {section.body.map((paragraph) => (
                    <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                  ))}
                </div>
              </article>
            ))}

            <div className={`${benefitCardClassName} text-center`}>
              <p className="text-base leading-relaxed text-nurture-charcoal/80">
                Questions about your plan? Tell us which benefit platform or
                insurer you have — we&apos;ll help you understand typical next
                steps for {brands.nestingPlace.name} services.
              </p>
            </div>
          </div>
        </div>
      </section>

      <MarketingSection
        waves="both"
        footerClearance
        waveTopFill={MARKETING_OAK_SURFACE}
        waveBottomFill={MARKETING_CREAM}
        className="bg-nurture-lilac !pt-[calc(5rem+2.5rem)] sm:!pt-[calc(7rem+3rem)]"
      >
        <div className="mx-auto max-w-screen-xl px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
          <SectionTitle
            title="Talk with our team"
            subtitle="We'll answer questions about coverage and documentation."
          />
          <div className="mt-10">
            <ContactOptions
              variant="contact"
              formHref="/contact?topic=benefits&audience=mom"
              whatsappMessage="Hi! I have a question about using my benefits with The Nesting Place."
            />
          </div>
        </div>
      </MarketingSection>
    </div>
  );
}
