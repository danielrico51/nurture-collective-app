import "server-only";

import { getLeadDetail } from "@/lib/leads/storage";
import type { ClientRecord } from "@/types/client";
import type { CoordinatorNote } from "@/types/lead";
import type { ProposalContextPackage } from "@/types/proposal";

const summarizeNotes = (notes: CoordinatorNote[]): string => {
  const callLogs = notes
    .filter((note) => note.type === "call_log")
    .slice(0, 5)
    .map((note) => note.body.trim())
    .filter(Boolean);
  if (callLogs.length > 0) return callLogs.join("\n\n");

  return notes
    .slice(0, 5)
    .map((note) => note.body.trim())
    .filter(Boolean)
    .join("\n\n");
};

export const buildProposalContext = async (
  leadId: string
): Promise<ProposalContextPackage> => {
  const detail = await getLeadDetail(leadId);
  if (!detail) {
    throw new Error("Lead not found");
  }

  const { lead, intakeProfile, notes, conversationPrep } = detail;
  const servicesRequested = [
    ...lead.supportInterests,
    ...(intakeProfile?.supportInterests ?? []),
  ].filter(Boolean);

  const budget =
    intakeProfile?.budgetPreference?.trim() ||
    intakeProfile?.insuranceProvider?.trim() ||
    "To be confirmed on discovery call";

  const familySize =
    intakeProfile?.challengesFreeText?.trim() ||
    intakeProfile?.maternalStage ||
    "Not specified";

  return {
    client_name: lead.name || intakeProfile?.name || "Client",
    services_requested: servicesRequested,
    budget,
    family_size: familySize,
    call_summary:
      summarizeNotes(notes) ||
      conversationPrep?.narrativeSummary?.trim() ||
      lead.challengesSummary ||
      "No call notes captured yet.",
    recommended_services: servicesRequested,
    pricing: {
      budget,
      note: "Use package pricing aligned with requested services.",
    },
    notes: [
      lead.challengesSummary,
      intakeProfile?.challengesFreeText,
      conversationPrep?.summaryBullets?.join("\n"),
    ]
      .filter(Boolean)
      .join("\n\n"),
    maternal_stage:
      lead.maternalStage || intakeProfile?.maternalStage || "unspecified",
    support_interests: servicesRequested,
    location: lead.locationZip || intakeProfile?.locationZip || "Northern NJ / NY area",
  };
};

/**
 * Build proposal context for a first-class client. Uses the linked lead's rich
 * intake/conversation context when available, otherwise falls back to the
 * client record itself (for clients with no lead in the CRM).
 */
export const buildProposalContextForClient = async (
  client: ClientRecord
): Promise<{ context: ProposalContextPackage; leadId: string | null }> => {
  if (client.leadId) {
    try {
      const context = await buildProposalContext(client.leadId);
      return { context, leadId: client.leadId };
    } catch (error) {
      console.warn(
        "[proposals] lead context unavailable, using client record:",
        error
      );
    }
  }

  const services = client.tags ?? [];
  const context: ProposalContextPackage = {
    client_name: client.name || "Client",
    services_requested: services,
    budget: "To be confirmed on discovery call",
    family_size: "Not specified",
    call_summary: client.notesSummary || "No call notes captured yet.",
    recommended_services: services,
    pricing: {
      budget: "To be confirmed on discovery call",
      note: "Use package pricing aligned with requested services.",
    },
    notes: client.notesSummary || "",
    maternal_stage: "unspecified",
    support_interests: services,
    location: client.locationZip || "Northern NJ / NY area",
  };

  return { context, leadId: client.leadId };
};
