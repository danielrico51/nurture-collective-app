/** Master Google Doc body — placeholders must match googleWorkspace.ts replacements. */
export const PROPOSAL_TEMPLATE_TITLE =
  "Proposal Template (Master — Nesting Place Postpartum Doula)";

/**
 * Redacted from a real TNP postpartum doula contract.
 * Personal/client fields are placeholders; firm boilerplate stays fixed.
 */
export const PROPOSAL_TEMPLATE_SECTIONS = [
  "{{DATE}}",
  "",
  "{{CLIENT_NAME}}",
  "",
  "The Nesting Place Postpartum Doula Contract",
  "",
  "YOUR CLIENT COMMITMENT",
  "• You agree to read and adhere to the guidelines provided in this contract.",
  "• You agree to communicate your ongoing needs with us in order to best support you.",
  "• Once the schedule is agreed upon with doula, no cancellations except extenuating circumstances.",
  "",
  "SERVICE DETAILS",
  "{{SERVICES}}",
  "• Postpartum sessions are required to be a minimum of 4 day hours and 10 night hours (unless otherwise agreed upon ahead of time).",
  "• The help provided during postpartum appointments will be tailored to your specific needs. Examples of physical support include observing your postpartum recovery, suggesting self-care techniques, assisting in bathing, feeding, comforting the baby, organizing your nursery/home, maintaining simple housework, and baby's laundry (when requested).",
  "• Examples of informational support include discussing postpartum care, infant care, making referrals as needed, providing evidence-based information, etc.",
  "• Examples of emotional/spiritual support include listening to your journey, fears, frustrations, concerns, challenges, and helping you put a plan in place to feel your best.",
  "• The health of your baby and your family is our primary concern. Our doulas do their very best to monitor their health to the best of their ability. If it is your preference that your doula wear a mask, please let them and/or us know at any time and they will be happy to do so.",
  "",
  "AS A DOULA (a non-medical professional), Your Doula is not able to:",
  "• Perform medical and clinical tasks for you and/or on you or your baby.",
  "• Make a final health care decision for you. Instead, your doula will help you make an informed decision, discussing the benefits, risks and alternatives of said choice.",
  "• Transport you, your baby or family in the doula's vehicle no matter the circumstance.",
  "• Perform major house cleaning tasks (e.g., washing bathrooms, windows, or floors).",
  "",
  "FOLLOWING THE BIRTH",
  "{{TIMELINE}}",
  "",
  "FEES",
  "{{PRICING}}",
  "• If additional hours are needed, schedule and fee will be discussed with TNP and the contract will be adjusted accordingly.",
  "• If services occur on a major holiday, additional fees may be charged at the discretion of TNP.",
  "• Payments can be made via Zelle, Cash App, Venmo, or cash. If paid by Venmo or credit card a processing fee of 3% will be added.",
  "• Venmo: @thenestingplace",
  "• Zelle: thenestingplacenj@gmail.com",
  "• Cash App: $thenestingplace",
  "",
  "FAILURE TO PROVIDE SERVICES",
  "• We will make every effort to provide the services described in this contract.",
  "• If we fail to provide services due to circumstances beyond anyone's control (i.e. a natural catastrophe or extremely rapid labor), you will not be charged for this missed appointment and your appointment will be rescheduled based on availability.",
  "",
  "ADDITIONAL ITEMS",
  "The Nesting Place has a 100% no solicitation policy for one year. Our doulas are contracted professionals and cannot be hired privately as a doula or in any capacity by a client (i.e. babysitter, nanny).",
  "",
  "AGREEMENT",
  "{{TERMS}}",
  "",
  "{{NEXT_STEPS}}",
  "",
  "Print Name of Client: _____________________________________",
  "",
  "Signature of Client:   ______________________________________",
  "",
  "Client Address:         ______________________________________",
  "",
  "Emergency Name/#   ______________________________________",
  "",
  "Date of Signature:     ______________________________________",
  "",
  "",
  "Other TNP Services:",
  "Acupuncture",
  "Breastfeeding & Newborn Care Classes",
  "Childbirth Education/Holistic Lamaze",
  "Gender Blood work @ six weeks or after (twenty four hours)",
  "Infant/Child CPR",
  "Lactation Consultations (In home or @ TNP)",
  "Perinatal Counseling",
  "Prenatal/Postpartum Massage",
  "",
  "",
  "www.thenestingplacenj.com",
] as const;

export const buildProposalTemplateBody = (): string =>
  PROPOSAL_TEMPLATE_SECTIONS.join("\n");

export const PROPOSAL_TEMPLATE_PLACEHOLDERS = [
  "CLIENT_NAME",
  "DATE",
  "SERVICES",
  "TIMELINE",
  "PRICING",
  "TERMS",
  "NEXT_STEPS",
] as const;

export type ProposalTemplatePlaceholder =
  (typeof PROPOSAL_TEMPLATE_PLACEHOLDERS)[number];
