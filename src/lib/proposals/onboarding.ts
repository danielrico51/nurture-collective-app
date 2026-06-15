import "server-only";

import { getLeadById } from "@/lib/leads/storage";

/** Post-signature onboarding scaffold (Cognito + community in follow-up). */
export const runClientOnboardingAfterSignature = async (input: {
  clientId: string;
  proposalId: string;
}): Promise<void> => {
  const lead = await getLeadById(input.clientId);
  console.info("[proposals] onboarding scaffold", {
    clientId: input.clientId,
    proposalId: input.proposalId,
    clientEmail: lead?.email,
    tasks: [
      "Send welcome email",
      "Create community membership",
      "Schedule kickoff call",
    ],
  });
};
