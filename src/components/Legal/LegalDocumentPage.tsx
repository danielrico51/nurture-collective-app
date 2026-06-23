import Breadcrumb from "@/components/Common/Breadcrumb";
import {
  marketingPageShell,
  MARKETING_OAK_SURFACE,
} from "@/config/marketingDesign";
import type { LegalSection } from "@/content/legal";
import { legalLastUpdated } from "@/content/legal";

interface LegalDocumentPageProps {
  pageName: string;
  title: string;
  subtitle: string;
  sections: LegalSection[];
}

export const LegalDocumentPage = ({
  pageName,
  title,
  subtitle,
  sections,
}: LegalDocumentPageProps) => (
  <div className={marketingPageShell}>
    <Breadcrumb pageName={pageName} />
    <article
      className="py-12 sm:py-14 lg:py-16"
      style={{ backgroundColor: MARKETING_OAK_SURFACE }}
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <header className="border-b border-nurture-lilac/30 pb-8">
          <h1 className="font-serif text-3xl font-semibold text-nurture-charcoal sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm text-nurture-charcoal/70">{subtitle}</p>
          <p className="mt-2 text-xs text-nurture-charcoal/50">
            Last updated: {legalLastUpdated}
          </p>
        </header>

        <div className="prose-nurture mt-10 space-y-10">
          {sections.map((section) => (
            <section key={section.id} id={section.id}>
              <h2 className="font-serif text-xl font-semibold text-nurture-charcoal">
                {section.title}
              </h2>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-nurture-charcoal/80">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
                {section.bullets ? (
                  <ul className="list-disc space-y-2 pl-5">
                    {section.bullets.map((item) => (
                      <li key={item.slice(0, 40)}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      </div>
    </article>
  </div>
);
