import { findClientByEmail, findClientForMember } from "@/lib/clients/storage";
import { getLeadById } from "@/lib/leads/storage";
import type { LeadStatus } from "@/types/lead";

export type ConsultBookingLeadCrmSkipReason =
  | "existing_client_email"
  | "existing_member_client"
  | "converted_lead";

export type ConsultBookingLeadCrmDecision =
  | { sync: true }
  | {
      sync: false;
      reason: ConsultBookingLeadCrmSkipReason;
      clientId?: string;
      leadId?: string;
    };

/** Lead pipeline stages we should not reopen when someone books another call. */
export const POST_CONVERSION_LEAD_STATUSES: LeadStatus[] = [
  "converted",
  "converted_to_member",
  "under_contract",
];

export const isPostConversionLeadStatus = (status: LeadStatus): boolean =>
  POST_CONVERSION_LEAD_STATUSES.includes(status);

/**
 * Decide whether a booked intro / follow-up call should enter Lead CRM.
 *
 * Rule of thumb:
 * - Client CRM email match → skip (existing client follow-up)
 * - Signed-in member linked to a client → skip
 * - Lead already marked converted → skip
 * - Otherwise → sync (new prospect or active pipeline lead)
 */
export const resolveConsultBookingLeadCrmDecision = async (input: {
  userId: string;
  userEmail?: string | null;
  attendeeEmail: string;
  cognitoSub?: string | null;
}): Promise<ConsultBookingLeadCrmDecision> => {
  const attendeeEmail = input.attendeeEmail.trim().toLowerCase();
  if (!attendeeEmail) {
    return { sync: true };
  }

  const clientByEmail = await findClientByEmail(attendeeEmail);
  if (clientByEmail) {
    return {
      sync: false,
      reason: "existing_client_email",
      clientId: clientByEmail.clientId,
    };
  }

  const memberSub = input.cognitoSub?.trim();
  const memberEmail = input.userEmail?.trim();
  if (memberSub && memberEmail) {
    const memberClient = await findClientForMember({
      cognitoSub: memberSub,
      email: memberEmail,
    });
    if (memberClient) {
      return {
        sync: false,
        reason: "existing_member_client",
        clientId: memberClient.clientId,
      };
    }
  }

  const existingLead = await getLeadById(input.userId);
  if (existingLead && isPostConversionLeadStatus(existingLead.status)) {
    return {
      sync: false,
      reason: "converted_lead",
      leadId: existingLead.leadId,
    };
  }

  return { sync: true };
};
