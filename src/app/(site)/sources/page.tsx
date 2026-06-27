import Breadcrumb from "@/components/Common/Breadcrumb";
import {
  marketingCardCompact,
  marketingLink,
  marketingPageShell,
  MARKETING_OAK_SURFACE,
} from "@/config/marketingDesign";
import { buildPageMetadata } from "@/config/seo";
import { sourceCitations } from "@/content/sources";
import type { Metadata } from "next";

export const metadata: Metadata = buildPageMetadata({
  title: "Research Sources for Maternal Wellness Outcomes",
  description:
    "Published research and clinical sources cited for birth doula, postpartum, and newborn care statistics shared by The Nesting Place.",
  path: "/sources",
  keywords: [
    "birth doula research",
    "postpartum depression statistics sources",
    "doula outcomes evidence",
  ],
});

export default function SourcesPage() {
  return (
    <div className={marketingPageShell}>
      <Breadcrumb pageName="Sources" />

      <section
        className="py-12 sm:py-14 lg:py-16"
        style={{ backgroundColor: MARKETING_OAK_SURFACE }}
      >
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h1 className="font-serif text-3xl font-semibold text-nurture-charcoal sm:text-4xl">
              Research sources
            </h1>
            <p className="mt-4 text-lg text-nurture-charcoal/75">
              The statistics shown on our homepage are drawn from published
              research and clinical guidance. Links below open the original
              sources in a new tab.
            </p>

            <ul className="mt-12 space-y-4">
              {sourceCitations.map((citation) => (
                <li key={citation.url} className={`${marketingCardCompact} p-5`}>
                  <p className="font-medium text-nurture-charcoal">
                    {citation.publication}
                  </p>
                  <a
                    href={citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-2 inline-block break-all text-sm ${marketingLink}`}
                  >
                    {citation.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
