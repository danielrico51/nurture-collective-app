import { LegalDocumentPage } from "@/components/Legal/LegalDocumentPage";
import { legalBrand, legalEntity, privacyPolicySections } from "@/content/legal";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy Policy for ${legalBrand}, operated by ${legalEntity}.`,
};

export default function PrivacyPolicyPage() {
  return (
    <LegalDocumentPage
      pageName="Privacy Policy"
      title="Privacy Policy"
      subtitle={`How ${legalEntity} collects, uses, and protects information when you use ${legalBrand}.`}
      sections={privacyPolicySections}
    />
  );
}
