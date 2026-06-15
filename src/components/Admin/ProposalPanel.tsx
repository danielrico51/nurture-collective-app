"use client";

import {
  approveClientProposal,
  fetchClientProposals,
  generateClientProposal,
  reviseClientProposal,
  sendClientProposalForSignature,
} from "@/lib/api/proposalsClient";
import type { LeadRecord } from "@/types/lead";
import type { ProposalMetadata, ProposalStatus } from "@/types/proposal";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

const STATUS_LABELS: Record<ProposalStatus, string> = {
  DRAFT: "Draft",
  UNDER_REVIEW: "Under review",
  APPROVED: "Approved",
  AWAITING_SIGNATURE: "Awaiting signature",
  SIGNED: "Signed",
  DECLINED: "Declined",
  EXPIRED: "Expired",
};

const statusBadgeClass = (status: ProposalStatus) => {
  switch (status) {
    case "DRAFT":
      return "bg-slate-100 text-slate-700";
    case "UNDER_REVIEW":
      return "bg-amber-100 text-amber-800";
    case "APPROVED":
      return "bg-sky-100 text-sky-800";
    case "AWAITING_SIGNATURE":
      return "bg-violet-100 text-violet-800";
    case "SIGNED":
      return "bg-emerald-100 text-emerald-800";
    case "DECLINED":
      return "bg-rose-100 text-rose-800";
    case "EXPIRED":
      return "bg-nurture-charcoal/10 text-nurture-charcoal/70";
    default:
      return "bg-nurture-charcoal/10 text-nurture-charcoal/70";
  }
};

const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

interface ProposalPanelProps {
  lead: LeadRecord;
}

const ProposalPanel = ({ lead }: ProposalPanelProps) => {
  const [proposals, setProposals] = useState<ProposalMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedbackByProposal, setFeedbackByProposal] = useState<Record<string, string>>(
    {}
  );
  const [signerEmail, setSignerEmail] = useState(lead.email ?? "");

  const loadProposals = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchClientProposals(lead.leadId);
      setProposals(
        [...result.proposals].sort(
          (left, right) =>
            new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()
        )
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load proposals");
    } finally {
      setLoading(false);
    }
  }, [lead.leadId]);

  useEffect(() => {
    void loadProposals();
  }, [loadProposals]);

  const handleGenerate = async () => {
    setBusyId("generate");
    try {
      const result = await generateClientProposal(lead.leadId);
      setProposals((current) => {
        const without = current.filter(
          (item) => item.proposal_id !== result.metadata.proposal_id
        );
        return [result.metadata, ...without];
      });
      toast.success("Proposal generated — review in Google Docs when ready.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generation failed");
    } finally {
      setBusyId(null);
    }
  };

  const handleApprove = async (proposalId: string) => {
    setBusyId(proposalId);
    try {
      const result = await approveClientProposal(lead.leadId, proposalId);
      setProposals((current) =>
        current.map((item) =>
          item.proposal_id === proposalId ? result.metadata : item
        )
      );
      toast.success("Proposal approved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Approval failed");
    } finally {
      setBusyId(null);
    }
  };

  const handleRevise = async (proposalId: string) => {
    const feedback = feedbackByProposal[proposalId]?.trim();
    if (!feedback) {
      toast.error("Enter revision feedback first.");
      return;
    }
    setBusyId(`revise-${proposalId}`);
    try {
      const result = await reviseClientProposal(lead.leadId, proposalId, feedback);
      setProposals((current) =>
        current.map((item) =>
          item.proposal_id === proposalId ? result.metadata : item
        )
      );
      setFeedbackByProposal((current) => ({ ...current, [proposalId]: "" }));
      toast.success(`Revision v${result.metadata.version} generated.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Revision failed");
    } finally {
      setBusyId(null);
    }
  };

  const handleSendSignature = async (proposalId: string) => {
    const email = signerEmail.trim();
    if (!email) {
      toast.error("Signer email is required.");
      return;
    }
    setBusyId(`sign-${proposalId}`);
    try {
      const result = await sendClientProposalForSignature(
        lead.leadId,
        proposalId,
        email
      );
      setProposals((current) =>
        current.map((item) =>
          item.proposal_id === proposalId ? result.metadata : item
        )
      );
      toast.success("Signature request queued.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send for signature");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-nurture-sage/15 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/50">
          Proposals
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadProposals()}
            disabled={loading}
            className="text-xs font-medium text-nurture-sage-dark underline disabled:opacity-50"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={busyId === "generate"}
            className="rounded-full bg-nurture-sage px-4 py-2 text-xs font-semibold text-white hover:bg-nurture-sage-dark disabled:opacity-50"
          >
            {busyId === "generate" ? "Generating…" : "Generate proposal"}
          </button>
        </div>
      </div>

      {loading && proposals.length === 0 ? (
        <p className="mt-3 text-sm text-nurture-charcoal/55">Loading proposals…</p>
      ) : proposals.length === 0 ? (
        <p className="mt-3 text-sm text-nurture-charcoal/60">
          No proposals yet. Generate one from CRM intake, call notes, and pricing context.
        </p>
      ) : (
        <ul className="mt-3 space-y-4">
          {proposals.map((proposal) => {
            const isBusy = busyId === proposal.proposal_id;
            const isReviseBusy = busyId === `revise-${proposal.proposal_id}`;
            const isSignBusy = busyId === `sign-${proposal.proposal_id}`;
            const feedback = feedbackByProposal[proposal.proposal_id] ?? "";

            return (
              <li
                key={proposal.proposal_id}
                className="rounded-xl border border-nurture-sage/10 bg-nurture-cream/40 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(proposal.status)}`}
                  >
                    {STATUS_LABELS[proposal.status]}
                  </span>
                  <span className="text-xs text-nurture-charcoal/55">
                    v{proposal.version} · Updated {formatDate(proposal.updated_at)}
                  </span>
                </div>

                <dl className="mt-3 grid gap-2 text-xs text-nurture-charcoal/70 sm:grid-cols-2">
                  <div>
                    <dt className="font-semibold text-nurture-charcoal/50">Created</dt>
                    <dd>{formatDate(proposal.created_at)}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-nurture-charcoal/50">Approved</dt>
                    <dd>
                      {proposal.approved_at
                        ? `${formatDate(proposal.approved_at)}${proposal.approved_by ? ` · ${proposal.approved_by}` : ""}`
                        : "—"}
                    </dd>
                  </div>
                </dl>

                {proposal.google_doc_url ? (
                  <a
                    href={proposal.google_doc_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex text-sm font-medium text-nurture-sage-dark underline"
                  >
                    Open Google Doc
                  </a>
                ) : (
                  <p className="mt-3 text-xs text-nurture-charcoal/50">
                    Google Doc not linked — configure template ID for automatic document creation.
                  </p>
                )}

                {(proposal.status === "UNDER_REVIEW" || proposal.status === "DRAFT") && (
                  <div className="mt-4 space-y-3 border-t border-nurture-sage/10 pt-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleApprove(proposal.proposal_id)}
                        className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {isBusy ? "Approving…" : "Approve"}
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={feedback}
                      onChange={(event) =>
                        setFeedbackByProposal((current) => ({
                          ...current,
                          [proposal.proposal_id]: event.target.value,
                        }))
                      }
                      placeholder="Revision feedback for the AI writer…"
                      className="w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
                    />
                    <button
                      type="button"
                      disabled={isReviseBusy || !feedback.trim()}
                      onClick={() => void handleRevise(proposal.proposal_id)}
                      className="rounded-full border border-nurture-sage/30 px-4 py-2 text-xs font-semibold text-nurture-sage-dark hover:bg-nurture-sage/10 disabled:opacity-50"
                    >
                      {isReviseBusy ? "Revising…" : "Request changes & regenerate"}
                    </button>
                  </div>
                )}

                {proposal.status === "APPROVED" && (
                  <div className="mt-4 space-y-2 border-t border-nurture-sage/10 pt-4">
                    <label className="block text-xs font-semibold text-nurture-charcoal/50">
                      Signer email
                    </label>
                    <input
                      type="email"
                      value={signerEmail}
                      onChange={(event) => setSignerEmail(event.target.value)}
                      className="w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
                    />
                    <button
                      type="button"
                      disabled={isSignBusy}
                      onClick={() => void handleSendSignature(proposal.proposal_id)}
                      className="rounded-full bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                    >
                      {isSignBusy ? "Sending…" : "Send for e-signature"}
                    </button>
                  </div>
                )}

                {proposal.status === "SIGNED" && proposal.signed_at ? (
                  <p className="mt-3 text-xs font-medium text-emerald-700">
                    Signed {formatDate(proposal.signed_at)} — client onboarding triggered.
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ProposalPanel;
