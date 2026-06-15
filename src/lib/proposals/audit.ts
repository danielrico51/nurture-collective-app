import "server-only";

import { randomUUID } from "crypto";
import type { ProposalAuditEvent, ProposalAuditEventType } from "@/types/proposal";
import { appendProposalAuditEvent } from "@/lib/proposals/storage";

export const recordProposalAuditEvent = async (input: {
  event_type: ProposalAuditEventType;
  proposal_id: string;
  client_id: string;
  actor_id: string;
  actor_email: string;
  payload?: Record<string, unknown>;
}): Promise<ProposalAuditEvent> => {
  const event: ProposalAuditEvent = {
    event_id: randomUUID(),
    event_type: input.event_type,
    proposal_id: input.proposal_id,
    client_id: input.client_id,
    actor_id: input.actor_id,
    actor_email: input.actor_email,
    timestamp: new Date().toISOString(),
    payload: input.payload ?? {},
  };
  await appendProposalAuditEvent(event);
  return event;
};
