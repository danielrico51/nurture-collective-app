export interface BenefitSection {
  id: string;
  title: string;
  body: string[];
  highlights?: string[];
}

export const benefitsIntro =
  "Wondering how to pay for doula support? It may be easier than you think. We're committed to helping families explore every option to make care more accessible — because every family deserves compassionate, expert support during birth and postpartum.";

export const benefitSections: BenefitSection[] = [
  {
    id: "employee-benefits",
    title: "Employer benefits (Carrot, Maven, ProgenyHealth & more)",
    body: [
      "See the Employer family benefits section on this page for an overview of how companies offer care through platforms like Carrot, ProgenyHealth, and Maven Clinic — and how The Nesting Place can support your reimbursement process.",
    ],
    highlights: [
      "Carrot",
      "Maven Clinic",
      "ProgenyHealth",
      "Out-of-network reimbursement",
    ],
  },
  {
    id: "private-insurance",
    title: "Private insurance coverage",
    body: [
      "Most private insurance plans still do not automatically cover doula services, but it's always worth checking. Some insurance companies are making strides to offer coverage and/or reimbursement for doula support.",
      "We recommend reaching out to your insurance company to understand your coverage. In cases where there is coverage, this is usually offered as an out-of-network reimbursement — be prepared to pay upfront costs yourself.",
    ],
    highlights: [
      "Ask if doula care is an out-of-network benefit",
      "Ask about credential requirements",
      "Request written guidelines for coverage",
    ],
  },
  {
    id: "fsa-hsa",
    title: "FSA / HSA funds",
    body: [
      "If you have a Flexible Spending Account (FSA) or Health Savings Account (HSA), doula services often qualify. Many providers can accept direct payment from an FSA or HSA card, or provide documentation for reimbursement.",
    ],
  },
  {
    id: "medicaid",
    title: "Medicaid doula programs",
    body: [
      "Some states are expanding Medicaid coverage for doulas through maternal health initiatives. New Jersey and New York are among the states exploring or offering expanded access. Contact us and we're happy to help you understand what's possible in your area.",
    ],
  },
];
