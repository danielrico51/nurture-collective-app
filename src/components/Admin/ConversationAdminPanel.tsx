"use client";

import type { AdminConversationSummary } from "@/lib/api/intakeClient";
import type { LeadRecord } from "@/types/lead";

const formatDate = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const conversationStatusClass = (status: AdminConversationSummary["status"]) =>
  status === "active"
    ? "bg-emerald-100 text-emerald-800"
    : "bg-nurture-charcoal/10 text-nurture-charcoal/70";

interface ConversationAdminPanelProps {
  lead: LeadRecord;
  sessions: AdminConversationSummary[];
  loading: boolean;
  reopeningKey: string | null;
  onRefresh: () => void;
  onReopen: (sessionId?: string) => void;
}

const ConversationAdminPanel = ({
  lead,
  sessions,
  loading,
  reopeningKey,
  onRefresh,
  onReopen,
}: ConversationAdminPanelProps) => {
  const continuePath = lead.isGuest ? "/intake" : "/dashboard/intake";

  return (
    <div className="rounded-xl border border-nurture-sage/15 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/50">
          Concierge conversations
        </p>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="text-xs font-medium text-nurture-sage-dark underline disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="mt-3 text-sm text-nurture-charcoal/55">Loading sessions…</p>
      ) : sessions.length === 0 ? (
        <p className="mt-3 text-sm text-nurture-charcoal/60">
          No saved conversations yet.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {sessions.map((session) => {
            const reopenKey = `${lead.userId}:${session.id}`;
            const isReopening = reopeningKey === reopenKey;
            return (
              <li
                key={session.id}
                className="flex flex-col gap-3 rounded-xl border border-nurture-sage/10 bg-nurture-cream/40 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-nurture-charcoal/70">
                      {session.id.slice(0, 8)}…
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${conversationStatusClass(session.status)}`}
                    >
                      {session.status}
                    </span>
                    <span className="text-xs text-nurture-charcoal/50">
                      {session.messageCount} messages · {session.completionScore}%
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-nurture-charcoal/55">
                    Updated {formatDate(session.updatedAt)}
                  </p>
                </div>
                {session.status === "completed" ? (
                  <button
                    type="button"
                    disabled={Boolean(reopeningKey)}
                    onClick={() => onReopen(session.id)}
                    className="shrink-0 rounded-full border border-nurture-sage/30 px-4 py-2 text-xs font-semibold text-nurture-sage-dark hover:bg-nurture-sage/10 disabled:opacity-50"
                  >
                    {isReopening ? "Reopening…" : "Reopen conversation"}
                  </button>
                ) : (
                  <span className="text-xs font-medium text-emerald-700">
                    Active — can continue at {continuePath}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-3 text-xs text-nurture-charcoal/45">
        Reopening sets the session back to active
        {lead.isGuest
          ? " so the guest can continue at /intake."
          : " and resets member intake to draft for testing at /dashboard/intake."}
      </p>
    </div>
  );
};

export default ConversationAdminPanel;
