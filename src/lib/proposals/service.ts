import "server-only";

import { chatCompletionJson } from "@/lib/openai/client";
import { buildProposalContext } from "@/lib/proposals/contextBuilder";
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

const GENERATION_SYSTEM_PROMPT = `You are a proposal writer for The Nesting Place maternal wellness agency.
Return JSON only with keys: executive_summary, recommended_services, timeline, pricing, terms, next_steps.
recommended_services must be an array of objects with name, description, and optional frequency.
Use professional, warm language. Never copy example text verbatim — examples are style references only.
Pricing should be descriptive (packages/ranges), not invented dollar amounts unless context includes them.`;

const buildGenerationPrompt = (
  context: Awaited<ReturnType<typeof buildProposalContext>>,
  examples: Awaited<ReturnType<typeof retrieveProposalExamples>>,
  revisionNotes?: string
) => ({
  context,
  style_examples: examples.map((entry) => ({
    service_type: entry.service_type,
    style_reference: entry.style_reference,
  })),
  revision_notes: revisionNotes ?? null,
});

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
  const context = await buildProposalContext(input.clientId);
  const examples = await retrieveProposalExamples(context);
  const llmContent = await chatCompletionJson<ProposalLlmContent>([
    { role: "system", content: GENERATION_SYSTEM_PROMPT },
    {
      role: "user",
      content: JSON.stringify(buildGenerationPrompt(context, examples, input.revisionNotes)),
    },
  ]);

  const now = new Date().toISOString();
  let metadata: ProposalMetadata | null = null;

  if (input.existingProposalId) {
    metadata = await readProposalMetadata(input.clientId, input.existingProposalId);
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
    client_id: input.clientId,
    lead_id: input.clientId,
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
  await writeProposalDraft(input.clientId, proposalId, llmContent);
  await writeProposalVersion(input.clientId, proposalId, {
    version: nextVersion,
    created_at: now,
    created_by: input.actor.email,
    revision_notes: input.revisionNotes,
    content: llmContent,
  });

  await recordProposalAuditEvent({
    event_type: input.revisionNotes ? "proposal_revised" : "proposal_generated",
    proposal_id: proposalId,
    client_id: input.clientId,
    actor_id: input.actor.sub,
    actor_email: input.actor.email,
    payload: {
      version: nextVersion,
      google_doc_id: googleDocId,
      status,
    },
  });

  const lead = await getLeadById(input.clientId);
  if (lead) {
    await notifyProposalGenerated({
      clientName: lead.name,
      clientId: input.clientId,
      proposal: metadata,
    });
  }

  return { metadata, content: llmContent, google_doc_error: googleDocError };
};

export const approveProposal = async (input: {
  clientId: string;
  proposalId: string;
  actor: AuthUser;
}): Promise<ProposalMetadata> => {
  const metadata = await readProposalMetadata(input.clientId, input.proposalId);
  if (!metadata) throw new Error("Proposal not found");

  const draft = await readProposalDraft(input.clientId, input.proposalId);
  if (draft) {
    await writeProposalApproved(input.clientId, input.proposalId, draft);
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
    client_id: input.clientId,
    actor_id: input.actor.sub,
    actor_email: input.actor.email,
    payload: { approved_at: now },
  });

  const lead = await getLeadById(input.clientId);
  if (lead) {
    await notifyProposalApproved({ clientName: lead.name, proposal: updated });
  }

  return updated;
};

export const requestProposalRevision = async (input: {
  clientId: string;
  proposalId: string;
  feedback: string;
  actor: AuthUser;
}): Promise<{ metadata: ProposalMetadata; content: ProposalLlmContent }> => {
  const metadata = await readProposalMetadata(input.clientId, input.proposalId);
  if (!metadata) throw new Error("Proposal not found");

  await recordProposalAuditEvent({
    event_type: "proposal_revision_requested",
    proposal_id: input.proposalId,
    client_id: input.clientId,
    actor_id: input.actor.sub,
    actor_email: input.actor.email,
    payload: { feedback: input.feedback },
  });

  return generateProposalForClient({
    clientId: input.clientId,
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
  const metadata = await readProposalMetadata(input.clientId, input.proposalId);
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
    client_id: input.clientId,
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
  const metadata = await readProposalMetadata(input.clientId, input.proposalId);
  if (!metadata) throw new Error("Proposal not found");

  const now = new Date().toISOString();
  const updated: ProposalMetadata = {
    ...metadata,
    status: "SIGNED",
    signed_at: now,
    updated_at: now,
  };

  await writeProposalMetadata(updated);
  await writeProposalSigned(input.clientId, input.proposalId, {
    signature_request_id: input.signatureRequestId,
    signed_at: now,
    signed_pdf_key: input.signedPdfKey ?? null,
  });

  await updateLead(input.clientId, { status: "converted_to_member" });

  await recordProposalAuditEvent({
    event_type: "proposal_signed",
    proposal_id: input.proposalId,
    client_id: input.clientId,
    actor_id: "system",
    actor_email: "system@nesting-place.com",
    payload: {
      signature_request_id: input.signatureRequestId,
      signed_pdf_key: input.signedPdfKey ?? null,
    },
  });

  return updated;
};
