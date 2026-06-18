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
        <ul className="space-y-3">
          {comms.map((comm) => (
            <li
              key={comm.id}
              className="rounded-2xl border border-nurture-sage/15 bg-white p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-nurture-charcoal/50">
                <span className="font-semibold uppercase tracking-wide">
                  {comm.channel} · {comm.direction}
                </span>
                <span
                  className={
                    comm.status === "failed"
                      ? "font-semibold text-red-600"
                      : "text-emerald-700"
                  }
                >
                  {comm.status}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-nurture-charcoal">
                {comm.subject}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-nurture-charcoal/75">
                {comm.body}
              </p>
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-nurture-charcoal/50">
                <span>To {comm.to}</span>
                <span>{formatDate(comm.createdAt)}</span>
                {comm.sentByEmail ? <span>by {comm.sentByEmail}</span> : null}
              </div>
              {comm.error ? (
                <p className="mt-2 text-xs text-red-600">{comm.error}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ClientCommunicationsTab;
