/** Master Google Doc body — placeholders must match googleWorkspace.ts replacements. */
export const PROPOSAL_TEMPLATE_TITLE =
  "Proposal Template (Master — Nesting Place)";

export const PROPOSAL_TEMPLATE_SECTIONS = [
  "The Nesting Place",
  "Care Proposal",
  "",
  "Prepared for: {{CLIENT_NAME}}",
  "",
  "Executive Summary",
  "{{EXECUTIVE_SUMMARY}}",
  "",
  "Recommended Services",
  "{{SERVICES}}",
  "",
  "Pricing",
  "{{PRICING}}",
  "",
  "Timeline",
  "{{TIMELINE}}",
  "",
  "Terms",
  "{{TERMS}}",
  "",
  "Next Steps",
  "{{NEXT_STEPS}}",
] as const;

export const buildProposalTemplateBody = (): string =>
  PROPOSAL_TEMPLATE_SECTIONS.join("\n");

export const PROPOSAL_TEMPLATE_PLACEHOLDERS = [
  "CLIENT_NAME",
  "EXECUTIVE_SUMMARY",
  "SERVICES",
  "PRICING",
  "TIMELINE",
  "TERMS",
  "NEXT_STEPS",
] as const;
