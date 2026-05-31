export interface BenefitSection {
  id: string;
  title: string;
  body: string[];
  highlights?: string[];
}

export const benefitsIntro =
  "Expert support during pregnancy, birth, and postpartum. Many families use employer-sponsored benefits, private insurance reimbursement, or FSA/HSA funds — we're happy to help you understand what may apply to your situation.";

export const benefitsEmployerNote =
  "Some employers offer family benefits through third-party platforms (such as Carrot, Maven Clinic, or ProgenyHealth). We are not a benefits administrator and are not directly contracted with these companies today. Depending on your plan, doula or postpartum support may qualify for reimbursement — contact us and we can help you gather documentation.";

export const benefitSections: BenefitSection[] = [
  {
    id: "private-insurance",
    title: "Private insurance",
    body: [
      "Most private plans do not automatically cover doula services, but it's worth asking your insurer whether out-of-network reimbursement is available.",
      "When coverage exists, families typically pay The Nesting Place directly and submit documentation for reimbursement.",
    ],
  },
  {
    id: "fsa-hsa",
    title: "FSA / HSA",
    body: [
      "Doula and postpartum support often qualify under Flexible Spending Accounts (FSA) or Health Savings Accounts (HSA). We can provide receipts and service summaries for your records.",
    ],
  },
];
