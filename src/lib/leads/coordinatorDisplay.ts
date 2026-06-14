import type { LeadRecord } from "@/types/lead";
import type { TeamMember } from "@/types/teamMember";

/** Client-safe helper for showing who owns a lead in the CRM UI. */
export const getCoordinatorDisplayName = (
  lead: Pick<LeadRecord, "coordinatorId" | "coordinatorEmail">,
  members: TeamMember[]
): string => {
  if (!lead.coordinatorId && !lead.coordinatorEmail) {
    return "Unassigned";
  }

  const member = members.find((item) => item.id === lead.coordinatorId);
  return member?.label || lead.coordinatorEmail || "Assigned coordinator";
};
