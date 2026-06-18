import "server-only";

import {
  buildWelcomeEmail,
  sendClientEmail,
} from "@/lib/clients/communications";
import { getClientById, resolveStorageClientId } from "@/lib/clients/storage";

/** Post-signature onboarding: send the welcome email and log it. */
export const runClientOnboardingAfterSignature = async (input: {
  clientId: string;
  proposalId: string;
}): Promise<void> => {
  const storageClientId = await resolveStorageClientId(input.clientId);
  const client = await getClientById(storageClientId);

  if (!client) {
    console.warn("[proposals] onboarding skipped — client not found", {
      clientId: storageClientId,
      proposalId: input.proposalId,
    });
    return;
  }

  if (!client.email) {
    console.warn("[proposals] onboarding welcome email skipped — no client email", {
      clientId: storageClientId,
    });
    return;
  }

  const template = buildWelcomeEmail(client);
  try {
    await sendClientEmail({
      client,
      subject: template.subject,
      body: template.text,
      html: template.html,
      templateId: "welcome",
      sentBy: "system",
      sentByEmail: "system@nesting-place.com",
    });
  } catch (error) {
    console.error("[proposals] onboarding welcome email failed:", error);
  }
};
