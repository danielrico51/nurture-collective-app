"use client";

import {
  addAdminLeadNote,
  fetchAdminLeadDetail,
  fetchAdminLeads,
  updateAdminLead,
} from "@/lib/api/leadsClient";
import { MATERNAL_STAGE_LABELS } from "@/content/intake";
import type { MaternalStage } from "@/types/intake";
import type {
  CoordinatorNote,
  CoordinatorNoteType,
  LeadRecord,
  LeadStatus,
} from "@/types/lead";
import { LEAD_STATUSES } from "@/types/lead";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

type StatusFilter = "all" | LeadStatus;

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  intake_in_progress: "Intake in progress",
  intake_completed: "Intake completed",
  consult_scheduled: "Consult scheduled",
  consult_completed: "Consult completed",
  proposal_sent: "Proposal sent",
  qualified: "Qualified",
  lost: "Lost",
  stale: "Stale",
  converted: "Converted",
};

const NOTE_TYPE_LABELS: Record<CoordinatorNoteType, string> = {
  general: "General",
  call_log: "Call log",
  prep: "Prep",
  follow_up: "Follow-up",
};

const statusBadgeClass = (status: LeadStatus) => {
  switch (status) {
    case "new":
      return "bg-blue-100 text-blue-800";
    case "intake_completed":
    case "qualified":
      return "bg-nurture-sage/15 text-nurture-sage-dark";
    case "consult_scheduled":
    case "consult_completed":
      return "bg-violet-100 text-violet-800";
    case "proposal_sent":
      return "bg-amber-100 text-amber-800";
    case "converted":
      return "bg-emerald-100 text-emerald-800";
    case "lost":
    case "stale":
      return "bg-nurture-charcoal/10 text-nurture-charcoal/70";
    default:
      return "bg-nurture-cream text-nurture-charcoal/75";
  }
};

const formatDate = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

interface LeadQueueProps {
  coordinatorEmail: string;
  coordinatorId: string;
}

const LeadQueue = ({ coordinatorEmail, coordinatorId }: LeadQueueProps) => {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notesByLead, setNotesByLead] = useState<Record<string, CoordinatorNote[]>>({});
  const [notesLoadingId, setNotesLoadingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteType, setNoteType] = useState<CoordinatorNoteType>("general");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminLeads();
      setLeads(data.leads);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load leads");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadNotes = useCallback(async (leadId: string) => {
    setNotesLoadingId(leadId);
    try {
      const detail = await fetchAdminLeadDetail(leadId);
      setNotesByLead((current) => ({ ...current, [leadId]: detail.notes }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load notes");
    } finally {
      setNotesLoadingId(null);
    }
  }, []);

  const handleExpand = (lead: LeadRecord) => {
    const next = expandedId === lead.leadId ? null : lead.leadId;
    setExpandedId(next);
    setNoteDraft("");
    if (next && !notesByLead[lead.leadId]) {
      loadNotes(lead.leadId);
    }
  };

  const handleStatusChange = async (leadId: string, status: LeadStatus) => {
    setSavingId(leadId);
    try {
      await updateAdminLead(leadId, { status });
      await load();
      toast.success(`Lead updated to ${STATUS_LABELS[status]}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update lead");
    } finally {
      setSavingId(null);
    }
  };

  const handleAssignToMe = async (leadId: string) => {
    setSavingId(leadId);
    try {
      await updateAdminLead(leadId, { assignToMe: true });
      await load();
      toast.success("Lead assigned to you");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not assign lead");
    } finally {
      setSavingId(null);
    }
  };

  const handleAddNote = async (leadId: string) => {
    const body = noteDraft.trim();
    if (!body) return;
    setSavingId(leadId);
    try {
      const { note } = await addAdminLeadNote(leadId, body, noteType);
      setNotesByLead((current) => ({
        ...current,
        [leadId]: [note, ...(current[leadId] ?? [])],
      }));
      setNoteDraft("");
      toast.success("Note saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save note");
    } finally {
      setSavingId(null);
    }
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return leads.filter((lead) => {
      if (statusFilter !== "all" && lead.status !== statusFilter) return false;
      if (!query) return true;
      return (
        lead.name.toLowerCase().includes(query) ||
        lead.email.toLowerCase().includes(query) ||
        lead.phone.toLowerCase().includes(query) ||
        lead.leadId.toLowerCase().includes(query)
      );
    });
  }, [leads, search, statusFilter]);

  const counts = useMemo(() => {
    const base: Record<string, number> = { all: leads.length };
    for (const status of LEAD_STATUSES) {
      base[status] = leads.filter((lead) => lead.status === status).length;
    }
    return base;
  }, [leads]);

  const myLeads = useMemo(
    () => leads.filter((lead) => lead.coordinatorId === coordinatorId).length,
    [coordinatorId, leads]
  );

  if (loading) {
    return <p className="text-sm text-nurture-charcoal/60">Loading leads…</p>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        {error}
        <button type="button" onClick={load} className="ml-3 font-semibold underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-nurture-charcoal">
            Lead CRM
          </h2>
          <p className="mt-1 text-sm text-nurture-charcoal/65">
            Track new leads from AI intake, add coordinator notes, and move prospects
            through your pipeline.
          </p>
          <p className="mt-2 text-xs text-nurture-charcoal/50">
            Assigned to you: {myLeads} · Signed in as {coordinatorEmail}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="shrink-0 rounded-full border border-nurture-sage/30 px-4 py-2 text-sm font-medium text-nurture-sage-dark hover:bg-nurture-sage/10"
        >
          Refresh
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Search name, email, phone, lead id…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-xl border border-nurture-sage/30 px-4 py-2.5 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          {(["all", "new", "intake_in_progress", "intake_completed", "consult_scheduled"] as StatusFilter[]).map(
            (filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === filter
                    ? "bg-nurture-sage text-white"
                    : "bg-nurture-cream text-nurture-charcoal/70 hover:bg-nurture-sage/10"
                }`}
              >
                {filter === "all" ? "All" : STATUS_LABELS[filter as LeadStatus]}{" "}
                <span className="opacity-75">({counts[filter] ?? 0})</span>
              </button>
            )
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-nurture-sage/25 bg-nurture-cream/40 p-10 text-center">
          <p className="font-medium text-nurture-charcoal">No leads yet</p>
          <p className="mt-2 text-sm text-nurture-charcoal/60">
            Leads appear here when someone starts the AI intake chat.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((lead) => {
            const expanded = expandedId === lead.leadId;
            const notes = notesByLead[lead.leadId] ?? [];
            const stageLabel = lead.maternalStage
              ? MATERNAL_STAGE_LABELS[lead.maternalStage as MaternalStage] ?? lead.maternalStage
              : "—";

            return (
              <div
                key={lead.leadId}
                className="overflow-hidden rounded-2xl border border-nurture-sage/15 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => handleExpand(lead)}
                  className="flex w-full flex-col gap-3 p-4 text-left sm:flex-row sm:items-center sm:justify-between sm:p-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-nurture-charcoal">
                        {lead.name || "Unnamed lead"}
                      </p>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(lead.status)}`}
                      >
                        {STATUS_LABELS[lead.status]}
                      </span>
                      {lead.isGuest ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-800">
                          Guest
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-sm text-nurture-charcoal/65">
                      {lead.email || "No email"}
                      {lead.phone ? ` · ${lead.phone}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-4 text-sm text-nurture-charcoal/60">
                    <span>{stageLabel}</span>
                    <span>{lead.completionScore}%</span>
                    <span>{formatDate(lead.updatedAt)}</span>
                    <span aria-hidden>{expanded ? "▲" : "▼"}</span>
                  </div>
                </button>

                {expanded ? (
                  <div className="border-t border-nurture-sage/10 bg-nurture-cream/30 px-5 py-5">
                    <div className="mb-5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={savingId === lead.leadId}
                        onClick={() => handleAssignToMe(lead.leadId)}
                        className="rounded-full border border-nurture-sage/30 px-4 py-2 text-xs font-semibold text-nurture-sage-dark hover:bg-nurture-sage/10 disabled:opacity-50"
                      >
                        Assign to me
                      </button>
                      {(["consult_scheduled", "consult_completed", "proposal_sent", "qualified", "lost"] as LeadStatus[]).map(
                        (status) => (
                          <button
                            key={status}
                            type="button"
                            disabled={savingId === lead.leadId || lead.status === status}
                            onClick={() => handleStatusChange(lead.leadId, status)}
                            className={`rounded-full px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
                              lead.status === status
                                ? "bg-nurture-sage text-white"
                                : "border border-nurture-sage/25 bg-white text-nurture-charcoal/75"
                            }`}
                          >
                            {STATUS_LABELS[status]}
                          </button>
                        )
                      )}
                    </div>

                    <dl className="grid gap-4 sm:grid-cols-2">
                      <DetailItem label="Lead ID" value={lead.leadId} />
                      <DetailItem label="Source" value={lead.source} />
                      <DetailItem label="Coordinator" value={lead.coordinatorEmail || "Unassigned"} />
                      <DetailItem label="Intake status" value={lead.intakeStatus || "—"} />
                      <DetailItem
                        label="Support interests"
                        value={lead.supportInterests.join(", ") || "—"}
                      />
                      <DetailItem
                        label="Challenges"
                        value={lead.challengesSummary || "—"}
                      />
                    </dl>

                    <div className="mt-6 rounded-xl border border-nurture-sage/15 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/50">
                        Coordinator notes
                      </p>

                      {notesLoadingId === lead.leadId ? (
                        <p className="mt-3 text-sm text-nurture-charcoal/55">Loading notes…</p>
                      ) : notes.length === 0 ? (
                        <p className="mt-3 text-sm text-nurture-charcoal/55">No notes yet.</p>
                      ) : (
                        <ul className="mt-3 space-y-3">
                          {notes.map((note) => (
                            <li
                              key={note.id}
                              className="rounded-xl border border-nurture-sage/10 bg-nurture-cream/40 p-3 text-sm"
                            >
                              <div className="flex flex-wrap items-center gap-2 text-xs text-nurture-charcoal/55">
                                <span className="font-semibold text-nurture-charcoal/70">
                                  {NOTE_TYPE_LABELS[note.type]}
                                </span>
                                <span>{note.authorEmail || note.authorId}</span>
                                <span>{formatDate(note.createdAt)}</span>
                              </div>
                              <p className="mt-2 whitespace-pre-wrap text-nurture-charcoal/80">
                                {note.body}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="mt-4 space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {(Object.keys(NOTE_TYPE_LABELS) as CoordinatorNoteType[]).map(
                            (type) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => setNoteType(type)}
                                className={`rounded-full px-3 py-1 text-xs font-medium ${
                                  noteType === type
                                    ? "bg-nurture-sage text-white"
                                    : "border border-nurture-sage/25 text-nurture-charcoal/70"
                                }`}
                              >
                                {NOTE_TYPE_LABELS[type]}
                              </button>
                            )
                          )}
                        </div>
                        <textarea
                          rows={3}
                          value={noteDraft}
                          onChange={(event) => setNoteDraft(event.target.value)}
                          placeholder="Add a prep note, call log, or follow-up…"
                          className="w-full rounded-xl border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage"
                        />
                        <button
                          type="button"
                          disabled={savingId === lead.leadId || !noteDraft.trim()}
                          onClick={() => handleAddNote(lead.leadId)}
                          className="rounded-full bg-nurture-sage px-4 py-2 text-sm font-semibold text-white hover:bg-nurture-sage-dark disabled:opacity-50"
                        >
                          Save note
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/45">
      {label}
    </dt>
    <dd className="mt-1 text-sm text-nurture-charcoal/80">{value}</dd>
  </div>
);

export default LeadQueue;
