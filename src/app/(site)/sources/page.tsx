import Breadcrumb from "@/components/Common/Breadcrumb";
import { sourceSections } from "@/content/sources";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sources | The Nesting Place",
  description:
    "Research sources cited for maternal wellness outcome statistics on The Nesting Place website.",
};

export default function SourcesPage() {
  return (
    <>
      <Breadcrumb pageName="Sources" />
      <section className="py-16">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <p className="text-lg text-nurture-charcoal/75">
              The statistics shown on our homepage are drawn from published
              research and clinical guidance. Links below open the original
              sources in a new tab.
            </p>

            <div className="mt-12 space-y-12">
              {sourceSections.map((section) => (
                <div key={section.id}>
                  <h2 className="font-serif text-2xl font-semibold text-nurture-charcoal">
                    {section.title}
                  </h2>
                  <ul className="mt-5 space-y-4">
                    {section.citations.map((citation) => (
                      <li
                        key={citation.url}
                        className="rounded-2xl border border-nurture-sage/15 bg-white p-5 shadow-sm"
                      >
                        <p className="font-medium text-nurture-charcoal">
                          {citation.label}
                        </p>
                        <p className="mt-1 text-sm text-nurture-charcoal/65">
                          {citation.publication}
                        </p>
                        <a
                          href={citation.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-block text-sm font-medium text-nurture-sage-dark hover:underline"
                        >
                          View source →
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
