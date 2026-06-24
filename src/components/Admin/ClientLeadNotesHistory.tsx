"use client";

import { coordinatorNoteTypeLabel } from "@/lib/clients/leadNotesShared";
import type { CoordinatorNote } from "@/types/lead";

interface ClientLeadNotesHistoryProps {
  leadId: string | null;
  leadNotes: CoordinatorNote[];
  leadNotesSummary: string | null;
}

const formatDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const ClientLeadNotesHistory = ({
  leadId,
  leadNotes,
  leadNotesSummary,
}: ClientLeadNotesHistoryProps) => {
  if (!leadId || leadNotes.length === 0) return null;

  return (
    <div className="rounded-2xl border border-violet-200/70 bg-violet-50/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-900/70">
            Lead CRM history
          </p>
          <p className="mt-1 text-xs text-nurture-charcoal/55">
            Coordinator notes from before conversion · Lead {leadId}
          </p>
        </div>
        <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-900">
          {leadNotes.length} note{leadNotes.length === 1 ? "" : "s"}
        </span>
      </div>

      {leadNotesSummary ? (
        <div className="mt-4 rounded-xl border border-violet-200/50 bg-white/70 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-900/60">
            Summary
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-nurture-charcoal/85">
            {leadNotesSummary}
          </p>
        </div>
      ) : null}

      <ul className="mt-4 space-y-3">
        {[...leadNotes]
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .map((note) => (
            <li
              key={note.id}
              className="rounded-xl border border-violet-200/40 bg-white/80 p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-nurture-charcoal/50">
                <span className="font-semibold uppercase tracking-wide text-violet-900/70">
                  {coordinatorNoteTypeLabel(note.type)}
                </span>
                <span>{formatDate(note.createdAt)}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-nurture-charcoal/85">
                {note.body}
              </p>
              {note.authorEmail ? (
                <p className="mt-2 text-xs text-nurture-charcoal/45">
                  {note.authorEmail}
                </p>
              ) : null}
            </li>
          ))}
      </ul>
    </div>
  );
};

export default ClientLeadNotesHistory;
