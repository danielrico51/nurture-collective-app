import type { ProposalContextPackage, ProposalLibraryEntry } from "@/types/proposal";

export const PROPOSAL_GENERATION_SYSTEM_PROMPT = `You are a contract writer for The Nesting Place (TNP) maternal wellness agency.

Your job is to produce a client-specific service agreement by ADAPTING the provided example agreement(s) — not inventing a new format.

Rules:
1. Treat primary_format_example as the blueprint: mirror its document title pattern, section order, heading style, level of detail, legal tone, service granularity, payment structure, and terms language.
2. Replace only client-specific details (name, dates, hours, service mix, location) using client_context. Never copy fictional placeholder names from examples.
3. recommended_services must match the example's count and specificity (same types of subsections — e.g. prenatal / labor / postpartum — with similar sentence length and duty lists).
4. pricing must follow the example's payment_pattern (deposit %, balance timing, non-refundable language, payment methods) using context budget when known, otherwise the example's representative ranges.
5. terms must include scope limitations, cancellation/refund rules, and practice boundaries in the same style as the example — not generic marketing copy.
6. executive_summary is the opening agreement paragraph (purpose + scope), not a sales pitch.
7. timeline maps to FOLLOWING THE BIRTH; terms maps to AGREEMENT; next_steps includes 24-hour offer validity when in the example.
8. Return JSON only with keys: executive_summary, recommended_services, timeline, pricing, terms, next_steps.
   recommended_services: array of { name, description, frequency? }.
9. For TNP postpartum contracts, recommended_services bullets should read like:
   "Postpartum care package" with "You will be receiving [N] hours… with [doula]. Care outlined as follows: …"
   and a separate "Carrot Fertility" bullet when applicable.
10. pricing must be fee lines suitable for the FEES section (total, deposit at signing, balance after first week).`;

export const serializeExampleForPrompt = (
  entry: ProposalLibraryEntry
): Record<string, unknown> => ({
  id: entry.id,
  title: entry.title,
  service_type: entry.service_type,
  document_structure: entry.document_structure ?? null,
  style_reference: entry.style_reference,
});

export const buildProposalUserPrompt = (input: {
  context: ProposalContextPackage;
  examples: ProposalLibraryEntry[];
  revisionNotes?: string;
}): string => {
  const [primary, ...additional] = input.examples;

  return JSON.stringify(
    {
      instruction:
        "Draft the agreement for client_context by adapting primary_format_example. " +
        "Match its structure and tone closely; adjust details only.",
      primary_format_example: primary ? serializeExampleForPrompt(primary) : null,
      additional_format_examples: additional.map(serializeExampleForPrompt),
      client_context: input.context,
      revision_notes: input.revisionNotes?.trim() || null,
    },
    null,
    2
  );
};
