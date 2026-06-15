import { NextRequest, NextResponse } from "next/server";
import { proposalsStorageConfig } from "@/lib/proposals/config";
import { recordProposalAuditEvent } from "@/lib/proposals/audit";
import {
  notifyProposalDeclined,
  notifyProposalExpired,
  notifyProposalSigned,
} from "@/lib/proposals/slack";
import { readProposalMetadata, writeProposalMetadata } from "@/lib/proposals/storage";
import { handleProposalSigned } from "@/lib/proposals/service";
import { runClientOnboardingAfterSignature } from "@/lib/proposals/onboarding";
import { getLeadById } from "@/lib/leads/storage";
import type { SignatureWebhookPayload } from "@/types/proposal";

export const dynamic = "force-dynamic";

const verifyWebhookSecret = (request: NextRequest): boolean => {
  const secret = proposalsStorageConfig.signatureWebhookSecret;
  if (!secret) return process.env.NODE_ENV === "development";
  const header = request.headers.get("x-proposal-signature-secret");
  return header === secret;
};

export async function POST(request: NextRequest) {
  if (!verifyWebhookSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as SignatureWebhookPayload;
    const clientId = body.client_id?.trim();
    const proposalId = body.proposal_id?.trim();
    const signatureRequestId = body.signature_request_id?.trim();

    if (!clientId || !proposalId || !signatureRequestId) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const metadata = await readProposalMetadata(clientId, proposalId);
    if (!metadata) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const lead = await getLeadById(clientId);

    if (body.event === "SIGNED") {
      const updated = await handleProposalSigned({
        clientId,
        proposalId,
        signatureRequestId,
      });
      await runClientOnboardingAfterSignature({ clientId, proposalId });
      if (lead) {
        await notifyProposalSigned({ clientName: lead.name, proposal: updated });
      }
      return NextResponse.json({ ok: true, metadata: updated });
    }

    const status = body.event === "DECLINED" ? "DECLINED" : "EXPIRED";
    const updated = {
      ...metadata,
      status,
      updated_at: new Date().toISOString(),
    } as const;
    await writeProposalMetadata(updated);
    await recordProposalAuditEvent({
      event_type: status === "DECLINED" ? "proposal_declined" : "proposal_expired",
      proposal_id: proposalId,
      client_id: clientId,
      actor_id: "system",
      actor_email: "system@nesting-place.com",
      payload: { signature_request_id: signatureRequestId },
    });

    if (lead) {
      if (status === "DECLINED") {
        await notifyProposalDeclined({ clientName: lead.name, proposalId });
      } else {
        await notifyProposalExpired({ clientName: lead.name, proposalId });
      }
    }

    return NextResponse.json({ ok: true, metadata: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
