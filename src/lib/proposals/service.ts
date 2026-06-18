import "server-only";

import { chatCompletionJson } from "@/lib/openai/client";
import { buildProposalContextForClient } from "@/lib/proposals/contextBuilder";
import {
  resolveClientForProposal,
  resolveStorageClientId,
  updateClient,
} from "@/lib/clients/storage";
import {
  buildProposalUserPrompt,
  PROPOSAL_GENERATION_SYSTEM_PROMPT,
} from "@/lib/proposals/generationPrompt";
import { retrieveProposalExamples } from "@/lib/proposals/library/retrieval";
import { createProposalGoogleDoc } from "@/lib/proposals/googleWorkspace";
import { recordProposalAuditEvent } from "@/lib/proposals/audit";
import {
  readProposalMetadata,
  writeProposalApproved,
  writeProposalDraft,
  writeProposalMetadata,
  writeProposalSigned,
  writeProposalVersion,
  readProposalDraft,
} from "@/lib/proposals/storage";
import { getLeadById, updateLead } from "@/lib/leads/storage";
import { notifyProposalApproved, notifyProposalGenerated } from "@/lib/proposals/slack";
import type { AuthUser } from "@/lib/auth/verifyRequest";
import type {
  ProposalLlmContent,
  ProposalMetadata,
  ProposalStatus,
} from "@/types/proposal";
import { randomUUID } from "crypto";

export const generateProposalForClient = async (input: {
  clientId: string;
  actor: AuthUser;
  revisionNotes?: string;
  existingProposalId?: string;
}): Promise<{
  metadata: ProposalMetadata;
  content: ProposalLlmContent;
  google_doc_error?: string | null;
}> => {
  const client = await resolveClientForProposal(input.clientId);
  const storageClientId = client.clientId;
  const { context, leadId } = await buildProposalContextForClient(client);
  const examples = await retrieveProposalExamples(context);
  const llmContent = await chatCompletionJson<ProposalLlmContent>([
    { role: "system", content: PROPOSAL_GENERATION_SYSTEM_PROMPT },
    {
      role: "user",
      content: buildProposalUserPrompt({
        context,
        examples,
        revisionNotes: input.revisionNotes,
      }),
    },
  ]);

  const now = new Date().toISOString();
  let metadata: ProposalMetadata | null = null;

  if (input.existingProposalId) {
    metadata = await readProposalMetadata(storageClientId, input.existingProposalId);
  }

  const proposalId = metadata?.proposal_id ?? randomUUID();
  const nextVersion = (metadata?.version ?? 0) + 1;

  let googleDocId = metadata?.google_doc_id ?? null;
  let googleDocUrl = metadata?.google_doc_url ?? null;
  let googleDocError: string | null = null;

  try {
    const doc = await createProposalGoogleDoc({
      clientName: context.client_name,
      content: llmContent,
    });
    googleDocId = doc.documentId;
    googleDocUrl = doc.documentUrl;
  } catch (error) {
    googleDocError =
      error instanceof Error ? error.message : "Google Doc creation failed";
    console.warn("[proposals] Google Doc creation skipped:", error);
  }

  const status: ProposalStatus = input.revisionNotes ? "DRAFT" : "UNDER_REVIEW";

  metadata = {
    proposal_id: proposalId,
    client_id: storageClientId,
    lead_id: leadId ?? "",
    status,
    google_doc_id: googleDocId,
    google_doc_url: googleDocUrl,
    signature_request_id: metadata?.signature_request_id ?? null,
    created_at: metadata?.created_at ?? now,
    updated_at: now,
    approved_at: null,
    approved_by: null,
    sent_at: metadata?.sent_at ?? null,
    signed_at: metadata?.signed_at ?? null,
    version: nextVersion,
    service_tags: context.services_requested,
  };

  await writeProposalMetadata(metadata);
  await writeProposalDraft(storageClientId, proposalId, llmContent);
  await writeProposalVersion(storageClientId, proposalId, {
    version: nextVersion,
    created_at: now,
    created_by: input.actor.email,
    revision_notes: input.revisionNotes,
    content: llmContent,
  });

  await recordProposalAuditEvent({
    event_type: input.revisionNotes ? "proposal_revised" : "proposal_generated",
    proposal_id: proposalId,
    client_id: storageClientId,
    actor_id: input.actor.sub,
    actor_email: input.actor.email,
    payload: {
      version: nextVersion,
      google_doc_id: googleDocId,
      status,
    },
  });

  await notifyProposalGenerated({
    clientName: client.name || context.client_name,
    clientId: storageClientId,
    proposal: metadata,
  });

  return { metadata, content: llmContent, google_doc_error: googleDocError };
};

export const approveProposal = async (input: {
  clientId: string;
  proposalId: string;
  actor: AuthUser;
}): Promise<ProposalMetadata> => {
  const storageClientId = await resolveStorageClientId(input.clientId);
  const metadata = await readProposalMetadata(storageClientId, input.proposalId);
  if (!metadata) throw new Error("Proposal not found");

  const draft = await readProposalDraft(storageClientId, input.proposalId);
  if (draft) {
    await writeProposalApproved(storageClientId, input.proposalId, draft);
  }

  const now = new Date().toISOString();
  const updated: ProposalMetadata = {
    ...metadata,
    status: "APPROVED",
    approved_at: now,
    approved_by: input.actor.email,
    updated_at: now,
  };

  await writeProposalMetadata(updated);
  await recordProposalAuditEvent({
    event_type: "proposal_approved",
    proposal_id: input.proposalId,
    client_id: storageClientId,
    actor_id: input.actor.sub,
    actor_email: input.actor.email,
    payload: { approved_at: now },
  });

  const lead = metadata.lead_id ? await getLeadById(metadata.lead_id) : null;
  await notifyProposalApproved({
    clientName: lead?.name ?? "Client",
    proposal: updated,
  });

  return updated;
};

export const requestProposalRevision = async (input: {
  clientId: string;
  proposalId: string;
  feedback: string;
  actor: AuthUser;
}): Promise<{ metadata: ProposalMetadata; content: ProposalLlmContent }> => {
  const storageClientId = await resolveStorageClientId(input.clientId);
  const metadata = await readProposalMetadata(storageClientId, input.proposalId);
  if (!metadata) throw new Error("Proposal not found");

  await recordProposalAuditEvent({
    event_type: "proposal_revision_requested",
    proposal_id: input.proposalId,
    client_id: storageClientId,
    actor_id: input.actor.sub,
    actor_email: input.actor.email,
    payload: { feedback: input.feedback },
  });

  return generateProposalForClient({
    clientId: storageClientId,
    actor: input.actor,
    revisionNotes: input.feedback,
    existingProposalId: input.proposalId,
  });
};

export const sendProposalForSignature = async (input: {
  clientId: string;
  proposalId: string;
  actor: AuthUser;
  signerEmail: string;
}): Promise<ProposalMetadata> => {
  const storageClientId = await resolveStorageClientId(input.clientId);
  const metadata = await readProposalMetadata(storageClientId, input.proposalId);
  if (!metadata) throw new Error("Proposal not found");
  if (metadata.status !== "APPROVED") {
    throw new Error("Proposal must be approved before sending for signature");
  }

  const signatureRequestId = `sig_${randomUUID()}`;
  const now = new Date().toISOString();
  const updated: ProposalMetadata = {
    ...metadata,
    status: "AWAITING_SIGNATURE",
    signature_request_id: signatureRequestId,
    sent_at: now,
    updated_at: now,
  };

  await writeProposalMetadata(updated);
  await recordProposalAuditEvent({
    event_type: "proposal_sent_for_signature",
    proposal_id: input.proposalId,
    client_id: storageClientId,
    actor_id: input.actor.sub,
    actor_email: input.actor.email,
    payload: {
      signature_request_id: signatureRequestId,
      signer_email: input.signerEmail,
      google_doc_id: metadata.google_doc_id,
    },
  });

  return updated;
};

export const handleProposalSigned = async (input: {
  clientId: string;
  proposalId: string;
  signatureRequestId: string;
  signedPdfKey?: string;
}): Promise<ProposalMetadata> => {
  const storageClientId = await resolveStorageClientId(input.clientId);
  const metadata = await readProposalMetadata(storageClientId, input.proposalId);
  if (!metadata) throw new Error("Proposal not found");

  const now = new Date().toISOString();
  const updated: ProposalMetadata = {
    ...metadata,
    status: "SIGNED",
    signed_at: now,
    updated_at: now,
  };

  await writeProposalMetadata(updated);
  await writeProposalSigned(storageClientId, input.proposalId, {
    signature_request_id: input.signatureRequestId,
    signed_at: now,
    signed_pdf_key: input.signedPdfKey ?? null,
  });

  // Advance the client and (when linked) the originating lead.
  try {
    await updateClient(storageClientId, { status: "onboarding" });
  } catch (error) {
    console.error("[proposals] client status update failed:", error);
  }
  if (metadata.lead_id) {
    try {
      await updateLead(metadata.lead_id, { status: "converted_to_member" });
    } catch (error) {
      console.error("[proposals] lead conversion update failed:", error);
    }
  }

  await recordProposalAuditEvent({
    event_type: "proposal_signed",
    proposal_id: input.proposalId,
    client_id: storageClientId,
    actor_id: "system",
    actor_email: "system@nesting-place.com",
    payload: {
      signature_request_id: input.signatureRequestId,
      signed_pdf_key: input.signedPdfKey ?? null,
    },
  });

  return updated;
};
