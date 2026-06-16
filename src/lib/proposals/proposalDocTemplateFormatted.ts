import type { ProposalTemplatePlaceholder } from "@/lib/proposals/proposalDocTemplate";

export type TemplateBulletList =
  | "commitment"
  | "services-static"
  | "doula-limits"
  | "following-birth"
  | "fees-static"
  | "failure";

export type FormattedTemplateSegment =
  | { kind: "logo" }
  | { kind: "spacer" }
  | { kind: "bold-line"; text: string }
  | { kind: "line"; text: string }
  | { kind: "bullet"; text: string; list: TemplateBulletList; bold?: boolean }
  | { kind: "placeholder"; name: ProposalTemplatePlaceholder };

/**
 * Formatted master template — mirrors the Ria Galiano postpartum contract (.docx).
 * Personal fields are placeholders; TNP boilerplate uses bold headings + bullet lists.
 */
export const FORMATTED_POSTPARTUM_TEMPLATE_SEGMENTS: FormattedTemplateSegment[] =
  [
    { kind: "logo" },
    { kind: "spacer" },
    { kind: "placeholder", name: "DATE" },
    { kind: "spacer" },
    { kind: "placeholder", name: "CLIENT_NAME" },
    { kind: "spacer" },
    {
      kind: "bold-line",
      text: "The Nesting Place Postpartum Doula Contract",
    },
    { kind: "spacer" },
    { kind: "bold-line", text: "YOUR CLIENT COMMITMENT" },
    {
      kind: "bullet",
      list: "commitment",
      text: "You agree to read and adhere to the guidelines provided in this contract.",
    },
    {
      kind: "bullet",
      list: "commitment",
      text: "You agree to communicate your ongoing needs with us in order to best support you.",
    },
    {
      kind: "bullet",
      list: "commitment",
      text: "Once the schedule is agreed upon with doula, no cancellations except extenuating circumstances.",
    },
    { kind: "bold-line", text: "SERVICE DETAILS" },
    { kind: "placeholder", name: "SERVICES" },
    {
      kind: "bullet",
      list: "services-static",
      text: "Postpartum sessions are required to be a minimum of 4 day hours and 10 night hours (unless otherwise agreed upon ahead of time).",
    },
    {
      kind: "bullet",
      list: "services-static",
      text: "The help provided during postpartum appointments will be tailored to your specific needs. Examples of physical support include observing your postpartum recovery, suggesting self-care techniques, assisting in bathing, feeding, comforting the baby, organizing your nursery/home, maintaining simple housework, and baby's laundry (when requested).",
    },
    {
      kind: "bullet",
      list: "services-static",
      text: "Examples of informational support include discussing postpartum care, infant care, making referrals as needed, providing evidence-based information, etc.",
    },
    {
      kind: "bullet",
      list: "services-static",
      text: "Examples of emotional/spiritual support include listening to your journey, fears, frustrations, concerns, challenges, and helping you put a plan in place to feel your best.",
    },
    {
      kind: "bullet",
      list: "services-static",
      text: "The health of your baby and your family is our primary concern. Our doulas do their very best to monitor their health to the best of their ability. If it is your preference that your doula wear a mask, please let them and/or us know at any time and they will be happy to do so.",
    },
    {
      kind: "bold-line",
      text: "AS A DOULA (a non-medical professional), Your Doula is not able to:",
    },
    {
      kind: "bullet",
      list: "doula-limits",
      text: "Perform medical and clinical tasks for you and/or on you or your baby.",
    },
    {
      kind: "bullet",
      list: "doula-limits",
      text: "Make a final health care decision for you. Instead, your doula will help you make an informed decision, discussing the benefits, risks and alternatives of said choice.",
    },
    {
      kind: "bullet",
      list: "doula-limits",
      text: "Transport you, your baby or family in the doula's vehicle no matter the circumstance.",
    },
    {
      kind: "bullet",
      list: "doula-limits",
      text: "Perform major house cleaning tasks (e.g., washing bathrooms, windows, or floors).",
    },
    { kind: "bold-line", text: "FOLLOWING THE BIRTH" },
    { kind: "placeholder", name: "TIMELINE" },
    { kind: "bold-line", text: "FEES" },
    { kind: "placeholder", name: "PRICING" },
    {
      kind: "bullet",
      list: "fees-static",
      text: "If additional hours are needed, schedule and fee will be discussed with TNP and the contract will be adjusted accordingly.",
    },
    {
      kind: "bullet",
      list: "fees-static",
      text: "If services occur on a major holiday, additional fees may be charged at the discretion of TNP.",
    },
    {
      kind: "bullet",
      list: "fees-static",
      bold: true,
      text: "Payments can be made via Zelle, Cash App, Venmo, or cash. If paid by Venmo or credit card a processing fee of 3% will be added.",
    },
    {
      kind: "bullet",
      list: "fees-static",
      bold: true,
      text: "Venmo: @thenestingplace",
    },
    {
      kind: "bullet",
      list: "fees-static",
      bold: true,
      text: "Zelle: thenestingplacenj@gmail.com",
    },
    {
      kind: "bullet",
      list: "fees-static",
      bold: true,
      text: "Cash App: $thenestingplace",
    },
    { kind: "spacer" },
    { kind: "bold-line", text: "FAILURE TO PROVIDE SERVICES" },
    {
      kind: "bullet",
      list: "failure",
      text: "We will make every effort to provide the services described in this contract.",
    },
    {
      kind: "bullet",
      list: "failure",
      text: "If we fail to provide services due to circumstances beyond anyone's control (i.e. a natural catastrophe or extremely rapid labor), you will not be charged for this missed appointment and your appointment will be rescheduled based on availability.",
    },
    { kind: "bold-line", text: "ADDITIONAL ITEMS" },
    {
      kind: "line",
      text: "The Nesting Place has a 100% no solicitation policy for one year. Our doulas are contracted professionals and cannot be hired privately as a doula or in any capacity by a client (i.e. babysitter, nanny).",
    },
    { kind: "bold-line", text: "AGREEMENT" },
    { kind: "spacer" },
    { kind: "placeholder", name: "TERMS" },
    { kind: "spacer" },
    { kind: "placeholder", name: "NEXT_STEPS" },
    { kind: "spacer" },
    { kind: "spacer" },
    { kind: "bold-line", text: "Print Name of Client: _____________________________________" },
    { kind: "spacer" },
    { kind: "bold-line", text: "Signature of Client:   ______________________________________" },
    { kind: "spacer" },
    { kind: "bold-line", text: "Client Address:         ______________________________________" },
    { kind: "spacer" },
    { kind: "bold-line", text: "Emergency Name/#   ______________________________________" },
    { kind: "spacer" },
    { kind: "bold-line", text: "Date of Signature:     ______________________________________" },
    { kind: "spacer" },
    { kind: "spacer" },
    { kind: "bold-line", text: "Other TNP Services:" },
    { kind: "bold-line", text: "Acupuncture" },
    { kind: "bold-line", text: "Breastfeeding & Newborn Care Classes" },
    { kind: "bold-line", text: "Childbirth Education/Holistic Lamaze" },
    {
      kind: "bold-line",
      text: "Gender Blood work @ six weeks or after (twenty four hours)",
    },
    { kind: "bold-line", text: "Infant/Child CPR" },
    { kind: "bold-line", text: "Lactation Consultations (In home or @ TNP)" },
    { kind: "bold-line", text: "Perinatal Counseling" },
    { kind: "bold-line", text: "Prenatal/Postpartum Massage" },
    { kind: "spacer" },
    { kind: "spacer" },
    { kind: "bold-line", text: "www.thenestingplacenj.com" },
  ];
