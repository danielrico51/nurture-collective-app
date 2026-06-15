import "server-only";

import { postSlackMessage } from "@/lib/integrations/slack/client";
import { toAbsoluteUrl } from "@/config/siteUrl";
import type { ProposalMetadata } from "@/types/proposal";

const adminProposalUrl = (clientId: string) =>
  toAbsoluteUrl(`/admin/leads?lead=${encodeURIComponent(clientId)}`);

export const notifyProposalGenerated = async (input: {
  clientName: string;
  clientId: string;
  proposal: ProposalMetadata;
}): Promise<void> => {
  const docLink = input.proposal.google_doc_url ?? "Google Doc pending configuration";
  const text = `Proposal ready for review: ${input.clientName}`;
  await postSlackMessage({
    channel: "operations",
    text,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Proposal ready for review*\n*Client:* ${input.clientName}\n*Status:* ${input.proposal.status}\n*Doc:* ${docLink}\n*Admin:* ${adminProposalUrl(input.clientId)}`,
        },
      },
    ],
  });
};

export const notifyProposalApproved = async (input: {
  clientName: string;
  proposal: ProposalMetadata;
}): Promise<void> => {
  await postSlackMessage({
    channel: "operations",
    text: `Proposal approved for ${input.clientName}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Proposal approved*\n*Client:* ${input.clientName}\n*Approver:* ${input.proposal.approved_by ?? "unknown"}`,
        },
      },
    ],
  });
};

export const notifyProposalSigned = async (input: {
  clientName: string;
  proposal: ProposalMetadata;
}): Promise<void> => {
  await postSlackMessage({
    channel: "operations",
    text: `Proposal signed — ${input.clientName} converted to client`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Proposal signed*\n*Client:* ${input.clientName}\nOnboarding workflow triggered automatically.`,
        },
      },
    ],
  });
};

export const notifyProposalDeclined = async (input: {
  clientName: string;
  proposalId: string;
}): Promise<void> => {
  await postSlackMessage({
    channel: "operations",
    text: `Proposal declined: ${input.clientName}`,
  });
};

export const notifyProposalExpired = async (input: {
  clientName: string;
  proposalId: string;
}): Promise<void> => {
  await postSlackMessage({
    channel: "operations",
    text: `Proposal signature expired: ${input.clientName}`,
  });
};
