import { LegalDocumentPage } from "@/components/Legal/LegalDocumentPage";
import { legalBrand, legalEntity, termsOfUseSections } from "@/content/legal";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: `Terms of Use (End-User License Agreement) for ${legalBrand}, operated by ${legalEntity}.`,
};

export default function TermsPage() {
  return (
    <LegalDocumentPage
      pageName="Terms of Use"
      title="Terms of Use"
      subtitle={`End-user terms for websites and applications operated by ${legalEntity} as ${legalBrand}.`}
      sections={termsOfUseSections}
    />
  );
}
