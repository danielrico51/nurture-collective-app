"use client";

import {
  fetchClientCommunications,
  sendClientCommunication,
} from "@/lib/api/clientsClient";
import type { ClientCommunication } from "@/types/client";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

interface ClientCommunicationsTabProps {
  clientId: string;
  defaultEmail: string;
}

const formatDate = (value: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
};

const formatShortDate = (value: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
};

const statusClass = (status: ClientCommunication["status"]): string => {
  if (status === "failed") return "text-red-600";
  if (status === "sent") return "text-emerald-700";
  return "text-nurture-charcoal/60";
};

function CommunicationHistoryItem({
  comm,
  expanded,
  onToggle,
}: {
  comm: ClientCommunication;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="rounded-xl border border-nurture-sage/15 bg-white overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition hover:bg-nurture-cream/40"
      >
        <span
          className="mt-0.5 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-nurture-charcoal/45"
          aria-hidden
        >
          {expanded ? "▲" : "▼"}
        </span>
        <span className="min-w-0 flex-1 space-y-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-nurture-charcoal/50">
              {comm.channel} · {comm.direction}
            </span>
            <span
              className={`text-[10px] font-semibold uppercase tracking-wide ${statusClass(comm.status)}`}
            >
              {comm.status}
            </span>
            <span className="text-[10px] text-nurture-charcoal/40">
              {formatShortDate(comm.createdAt)}
            </span>
          </span>
          <span className="block truncate text-sm font-medium text-nurture-charcoal">
            {comm.subject || "(No subject)"}
          </span>
          {!expanded && comm.body ? (
            <span className="block truncate text-xs text-nurture-charcoal/55">
              {comm.body.replace(/\s+/g, " ").trim()}
            </span>
          ) : null}
        </span>
      </button>

      {expanded ? (
        <div className="border-t border-nurture-sage/10 px-3 pb-3 pt-2">
          <p className="whitespace-pre-wrap text-sm text-nurture-charcoal/75">
            {comm.body}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-nurture-charcoal/50">
            <span>To {comm.to}</span>
            <span>{formatDate(comm.createdAt)}</span>
            {comm.sentByEmail ? <span>by {comm.sentByEmail}</span> : null}
          </div>
          {comm.error ? (
            <p className="mt-2 text-xs text-red-600">{comm.error}</p>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

const ClientCommunicationsTab = ({
  clientId,
  defaultEmail,
}: ClientCommunicationsTabProps) => {
  const [comms, setComms] = useState<ClientCommunication[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [to, setTo] = useState(defaultEmail);
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [expandedCommId, setExpandedCommId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchClientCommunications(clientId);
      setComms(data.communications);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not load communications"
      );
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSend = async (
    payload: {
      to?: string;
      subject?: string;
      body?: string;
      template?: "welcome" | "proposal_follow_up";
    },
    successMessage: string
  ) => {
    setSaving(true);
    try {
      await sendClientCommunication(clientId, payload);
      toast.success(successMessage);
      setSubject("");
      setBodyText("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send email");
    } finally {
      setSaving(false);
    }
  };

  const handleCompose = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!subject.trim() || !bodyText.trim()) {
      toast.error("Subject and body are required");
      return;
    }
    await handleSend(
      { to: to.trim() || undefined, subject, body: bodyText },
      "Email sent"
    );
  };

  return (
    <div className="space-y-5">
      <form
        onSubmit={handleCompose}
        className="rounded-2xl border border-nurture-sage/15 bg-white p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-nurture-charcoal">
            Send email
          </h4>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                handleSend({ template: "welcome" }, "Welcome email sent")
              }
              className="rounded-full border border-nurture-sage/30 px-3 py-1.5 text-xs font-medium text-nurture-sage-dark transition hover:bg-nurture-sage/10 disabled:opacity-60"
            >
              Send welcome
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                handleSend(
                  { template: "proposal_follow_up" },
                  "Follow-up email sent"
                )
              }
              className="rounded-full border border-nurture-sage/30 px-3 py-1.5 text-xs font-medium text-nurture-sage-dark transition hover:bg-nurture-sage/10 disabled:opacity-60"
            >
              Proposal follow-up
            </button>
          </div>
        </div>

        <div className="mt-3 space-y-3">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
              To
            </span>
            <input
              type="email"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
              Subject
            </span>
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/60">
              Message
            </span>
            <textarea
              rows={5}
              value={bodyText}
              onChange={(event) => setBodyText(event.target.value)}
              className="mt-1 w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-4 rounded-full bg-nurture-sage px-5 py-2 text-sm font-semibold text-white transition hover:bg-nurture-sage-dark disabled:opacity-60"
        >
          {saving ? "Sending…" : "Send email"}
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-nurture-charcoal/60">Loading history…</p>
      ) : comms.length === 0 ? (
        <p className="text-sm text-nurture-charcoal/60">
          No communications logged yet.
        </p>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/50">
              History ({comms.length})
            </h4>
            {expandedCommId ? (
              <button
                type="button"
                onClick={() => setExpandedCommId(null)}
                className="text-xs font-medium text-nurture-sage-dark hover:underline"
              >
                Collapse all
              </button>
            ) : null}
          </div>
          <ul className="space-y-1.5">
            {comms.map((comm) => (
              <CommunicationHistoryItem
                key={comm.id}
                comm={comm}
                expanded={expandedCommId === comm.id}
                onToggle={() =>
                  setExpandedCommId((current) =>
                    current === comm.id ? null : comm.id
                  )
                }
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ClientCommunicationsTab;
