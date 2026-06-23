"use client";

import ConversationAdminPanel from "@/components/Admin/ConversationAdminPanel";
import LeadContactEditForm from "@/components/Admin/LeadContactEditForm";
import LeadSnapshotPanel from "@/components/Admin/LeadSnapshotPanel";
import LeadCoordinatorSelect from "@/components/Admin/LeadCoordinatorSelect";
import ManualLeadForm from "@/components/Admin/ManualLeadForm";
import ProposalPanel from "@/components/Admin/ProposalPanel";
import {
  MATERNAL_STAGE_LABELS,
  SUPPORT_INTEREST_LABELS,
} from "@/content/intake";
import {
  fetchAdminConversations,
  reopenAdminConversation,
  updateAdminIntakeStatus,
  type AdminConversationSummary,
} from "@/lib/api/intakeClient";
import {
  addAdminLeadNote,
  fetchAdminLeadDetail,
  fetchAdminLeads,
  updateAdminLead,
} from "@/lib/api/leadsClient";
import { convertLeadToClientRequest, fetchClientByLeadId } from "@/lib/api/clientsClient";
import { fetchTeamMembers } from "@/lib/api/tasksClient";
import { getCoordinatorDisplayName } from "@/lib/leads/coordinatorDisplay";
import { getAllowedLeadTransitions } from "@/lib/leads/workflow";
import type { MaternalStage, SupportInterest, IntakeStatus, CareRecommendation, IntakeProfile } from "@/types/intake";
import { INTAKE_STATUSES } from "@/types/intake";
import type {
  CoordinatorNote,
  CoordinatorNoteType,
  LeadConversationPrep,
  LeadRecord,
  LeadStatus,
  ManualLeadChannel,
} from "@/types/lead";
import type { ClientRecord } from "@/types/client";
import { LEAD_STATUSES, MANUAL_LEAD_CHANNELS } from "@/types/lead";
import type { TeamMember } from "@/types/teamMember";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

type StatusFilter = "all" | LeadStatus;
type QueueFilter = "active" | "archived" | "all";
type TypeFilter = "all" | "guest" | "member";
type AssignmentFilter = "all" | "mine" | "unassigned";

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  intake_in_progress: "Intake in progress",
  intake_completed: "Intake completed",
  consult_scheduled: "Consult scheduled",
  consult_completed: "Consult completed",
  send_to_doula: "Send to Doula",
  proposal_sent: "Proposal sent",
  qualified: "Qualified",
  lost: "Lost",
  stale: "Stale",
  converted: "Converted",
  converted_to_member: "Converted to member",
  under_contract: "Under contract",
};

const INTAKE_STATUS_LABELS: Record<IntakeStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  "in-review": "In review",
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
      return "bg-blue-600 text-white";
    case "intake_in_progress":
      return "bg-sky-600 text-white";
    case "intake_completed":
      return "bg-nurture-sage-dark text-white";
    case "qualified":
      return "bg-emerald-700 text-white";
    case "consult_scheduled":
      return "bg-violet-600 text-white";
    case "consult_completed":
      return "bg-violet-800 text-white";
    case "send_to_doula":
      return "bg-indigo-700 text-white";
    case "proposal_sent":
      return "bg-amber-600 text-white";
    case "converted":
    case "converted_to_member":
      return "bg-emerald-600 text-white";
    case "under_contract":
      return "bg-teal-700 text-white";
    case "lost":
      return "bg-nurture-charcoal text-white";
    case "stale":
      return "bg-stone-500 text-white";
    default:
      return "bg-nurture-sage-dark text-white";
  }
};

const statusRingClass = (status: LeadStatus) => {
  switch (status) {
    case "new":
      return "ring-blue-400";
    case "intake_in_progress":
      return "ring-sky-400";
    case "intake_completed":
      return "ring-nurture-sage";
    case "qualified":
      return "ring-emerald-400";
    case "consult_scheduled":
      return "ring-violet-400";
    case "consult_completed":
      return "ring-violet-500";
    case "send_to_doula":
      return "ring-indigo-400";
    case "proposal_sent":
      return "ring-amber-400";
    case "converted":
    case "converted_to_member":
      return "ring-emerald-400";
    case "under_contract":
      return "ring-teal-400";
    case "lost":
      return "ring-nurture-charcoal/60";
    case "stale":
      return "ring-stone-400";
    default:
      return "ring-nurture-sage";
  }
};

const statusCardAccentClass = (status: LeadStatus) => {
  switch (status) {
    case "new":
      return "border-l-blue-600";
    case "intake_in_progress":
      return "border-l-sky-600";
    case "intake_completed":
      return "border-l-nurture-sage-dark";
    case "qualified":
      return "border-l-emerald-700";
    case "consult_scheduled":
      return "border-l-violet-600";
    case "consult_completed":
      return "border-l-violet-800";
    case "send_to_doula":
      return "border-l-indigo-700";
    case "proposal_sent":
      return "border-l-amber-600";
    case "converted":
    case "converted_to_member":
      return "border-l-emerald-600";
    case "under_contract":
      return "border-l-teal-700";
    case "lost":
      return "border-l-nurture-charcoal";
    case "stale":
      return "border-l-stone-500";
    default:
      return "border-l-nurture-sage-dark";
  }
};

const LeadStatusBadge = ({
  status,
  size = "sm",
}: {
  status: LeadStatus;
  size?: "sm" | "lg";
}) => (
  <span
    className={`inline-flex shrink-0 items-center gap-2 rounded-full font-bold uppercase tracking-wide shadow-md ring-2 ring-offset-2 ${statusBadgeClass(status)} ${statusRingClass(status)} ${
      size === "lg" ? "px-5 py-2 text-sm" : "px-3.5 py-1.5 text-xs"
    }`}
  >
    <span
      className={`rounded-full bg-white/90 shadow-sm ${
        size === "lg" ? "h-3 w-3" : "h-2.5 w-2.5"
      }`}
      aria-hidden
    />
    {STATUS_LABELS[status]}
  </span>
);

const pipelineActionsForLead = (lead: LeadRecord): LeadStatus[] =>
  getAllowedLeadTransitions(lead.status, { isGuest: lead.isGuest });

const formatDate = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const formatLeadSource = (source: string): string => {
  if (source.startsWith("manual_")) {
    const channel = source.replace("manual_", "") as ManualLeadChannel;
    return (
      MANUAL_LEAD_CHANNELS.find((item) => item.value === channel)?.label ??
      "Manual entry"
    );
  }
  return source.replace(/_/g, " ");
};

interface LeadQueueProps {
  coordinatorEmail: string;
  coordinatorId: string;
}

const LeadQueue = ({ coordinatorEmail, coordinatorId }: LeadQueueProps) => {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersNotice, setMembersNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [queueFilter, setQueueFilter] = useState<QueueFilter>("active");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilter>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notesByLead, setNotesByLead] = useState<Record<string, CoordinatorNote[]>>({});
  const [prepByLead, setPrepByLead] = useState<Record<string, LeadConversationPrep | null>>({});
  const [intakeByLead, setIntakeByLead] = useState<Record<string, IntakeProfile | null>>({});
  const [recommendationsByLead, setRecommendationsByLead] = useState<
    Record<string, CareRecommendation[]>
  >({});
  const [conversationsByLead, setConversationsByLead] = useState<
    Record<string, AdminConversationSummary[]>
  >({});
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);
  const [conversationsLoadingId, setConversationsLoadingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [linkedClientByLead, setLinkedClientByLead] = useState<
    Record<string, ClientRecord | null | undefined>
  >({});
  const [reopeningKey, setReopeningKey] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteType, setNoteType] = useState<CoordinatorNoteType>("general");
  const [showManualForm, setShowManualForm] = useState(false);

  const loadMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      const data = await fetchTeamMembers();
      setMembers(data.members);
      setMembersNotice(data.partial ? data.message ?? null : null);
    } catch (err) {
      setMembersNotice(
        err instanceof Error ? err.message : "Could not load admin team"
      );
    } finally {
      setMembersLoading(false);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminLeads(true);
      setLeads(data.leads);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load leads");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    load();
  }, [load]);

  const loadDetail = useCallback(async (lead: LeadRecord) => {
    setDetailLoadingId(lead.leadId);
    try {
      const detail = await fetchAdminLeadDetail(lead.leadId);
      setNotesByLead((current) => ({ ...current, [lead.leadId]: detail.notes }));
      setPrepByLead((current) => ({
        ...current,
        [lead.leadId]: detail.conversationPrep,
      }));
      setIntakeByLead((current) => ({
        ...current,
        [lead.leadId]: detail.intakeProfile,
      }));
      setRecommendationsByLead((current) => ({
        ...current,
        [lead.leadId]: detail.recommendations,
      }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load lead detail");
    } finally {
      setDetailLoadingId(null);
    }
  }, []);

  const loadConversations = useCallback(async (lead: LeadRecord) => {
    setConversationsLoadingId(lead.leadId);
    try {
      const data = await fetchAdminConversations(lead.userId, lead.email);
      setConversationsByLead((current) => ({
        ...current,
        [lead.leadId]: data.sessions,
      }));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not load conversations"
      );
    } finally {
      setConversationsLoadingId(null);
    }
  }, []);

  const loadLinkedClient = useCallback(async (leadId: string) => {
    try {
      const { client } = await fetchClientByLeadId(leadId);
      setLinkedClientByLead((current) => ({ ...current, [leadId]: client }));
    } catch {
      setLinkedClientByLead((current) => ({ ...current, [leadId]: null }));
    }
  }, []);

  const handleExpand = (lead: LeadRecord) => {
    const next = expandedId === lead.leadId ? null : lead.leadId;
    setExpandedId(next);
    setNoteDraft("");
    setNoteType("prep");
    if (next) {
      if (!notesByLead[lead.leadId]) loadDetail(lead);
      if (!conversationsByLead[lead.leadId]) loadConversations(lead);
      if (linkedClientByLead[lead.leadId] === undefined) {
        void loadLinkedClient(lead.leadId);
      }
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

  const handleIntakeStatusChange = async (
    lead: LeadRecord,
    intakeStatus: IntakeStatus
  ) => {
    setSavingId(lead.leadId);
    try {
      await updateAdminIntakeStatus(lead.userId, intakeStatus);
      await load();
      await loadDetail(lead);
      toast.success(`Intake updated to ${INTAKE_STATUS_LABELS[intakeStatus]}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update intake");
    } finally {
      setSavingId(null);
    }
  };

  const handleCoordinatorChange = async (
    leadId: string,
    nextCoordinatorId: string
  ) => {
    setSavingId(leadId);
    try {
      const { lead } = await updateAdminLead(leadId, {
        coordinatorId: nextCoordinatorId,
      });
      setLeads((current) =>
        current.map((item) => (item.leadId === leadId ? lead : item))
      );
      toast.success(
        nextCoordinatorId
          ? `Assigned to ${getCoordinatorDisplayName(lead, members)}`
          : "Lead unassigned"
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not update assignment"
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleArchive = async (leadId: string) => {
    setSavingId(leadId);
    try {
      await updateAdminLead(leadId, { archive: true });
      setExpandedId(null);
      await load();
      toast.success("Removed from queue");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove lead");
    } finally {
      setSavingId(null);
    }
  };

  const handleRestore = async (leadId: string) => {
    setSavingId(leadId);
    try {
      await updateAdminLead(leadId, { restore: true });
      await load();
      toast.success("Restored to queue");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not restore lead");
    } finally {
      setSavingId(null);
    }
  };

  const handleConvertToClient = async (leadId: string) => {
    setConvertingId(leadId);
    try {
      const { client, created } = await convertLeadToClientRequest(leadId);
      setLinkedClientByLead((current) => ({ ...current, [leadId]: client }));
      toast.success(
        created
          ? "Client created — open Client CRM to manage billing and communications"
          : "This lead is already linked to a client"
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not convert lead to client"
      );
    } finally {
      setConvertingId(null);
    }
  };

  const handleReopenConversation = async (
    lead: LeadRecord,
    sessionId?: string
  ) => {
    const key = `${lead.userId}:${sessionId ?? "latest"}`;
    setReopeningKey(key);
    try {
      await reopenAdminConversation({
        userId: lead.userId,
        email: lead.email,
        sessionId,
        resetIntakeToDraft: !lead.isGuest,
      });
      await load();
      await loadDetail(lead);
      await loadConversations(lead);
      toast.success("Conversation reopened");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not reopen conversation"
      );
    } finally {
      setReopeningKey(null);
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
      if (queueFilter === "active" && lead.archivedAt) return false;
      if (queueFilter === "archived" && !lead.archivedAt) return false;
      if (typeFilter === "guest" && !lead.isGuest) return false;
      if (typeFilter === "member" && lead.isGuest) return false;
      if (assignmentFilter === "mine" && lead.coordinatorId !== coordinatorId) {
        return false;
      }
      if (
        assignmentFilter === "unassigned" &&
        Boolean(lead.coordinatorId || lead.coordinatorEmail)
      ) {
        return false;
      }
      if (statusFilter !== "all" && lead.status !== statusFilter) return false;
      if (!query) return true;
      return (
        lead.name.toLowerCase().includes(query) ||
        lead.email.toLowerCase().includes(query) ||
        lead.phone.toLowerCase().includes(query) ||
        lead.leadId.toLowerCase().includes(query) ||
        (lead.locationZip ?? "").toLowerCase().includes(query)
      );
    });
  }, [leads, queueFilter, typeFilter, assignmentFilter, search, statusFilter, coordinatorId]);

  const counts = useMemo(() => {
    const active = leads.filter((lead) => !lead.archivedAt);
    const base: Record<string, number> = {
      all: active.length,
      archived: leads.filter((lead) => lead.archivedAt).length,
      guest: active.filter((lead) => lead.isGuest).length,
      member: active.filter((lead) => !lead.isGuest).length,
      mine: active.filter((lead) => lead.coordinatorId === coordinatorId).length,
      unassigned: active.filter(
        (lead) => !lead.coordinatorId && !lead.coordinatorEmail
      ).length,
    };
    for (const status of LEAD_STATUSES) {
      base[status] = active.filter((lead) => lead.status === status).length;
    }
    return base;
  }, [leads, coordinatorId]);

  if (loading) {
    return <p className="text-sm text-nurture-charcoal/60">Loading lead CRM…</p>;
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
          <p className="mt-1 max-w-2xl text-sm text-nurture-charcoal/65">
            One queue for guest leads and members who created an account — plus
            leads you enter manually from phone calls, referrals, and other
            channels. Track pipeline, intake profiles, care recommendations,
            and concierge conversations.
          </p>
          <p className="mt-2 text-xs text-nurture-charcoal/50">
            Assigned to you: {counts.mine} · Signed in as {coordinatorEmail}
            {membersNotice ? ` · ${membersNotice}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowManualForm((open) => !open)}
            className="rounded-full bg-nurture-sage px-4 py-2 text-sm font-semibold text-white hover:bg-nurture-sage-dark"
          >
            {showManualForm ? "Close form" : "Add lead"}
          </button>
          <button
            type="button"
            onClick={load}
            className="rounded-full border border-nurture-sage/30 px-4 py-2 text-sm font-medium text-nurture-sage-dark hover:bg-nurture-sage/10"
          >
            Refresh
          </button>
        </div>
      </div>

      {showManualForm ? (
        <div className="mt-6">
          <ManualLeadForm
            members={members}
            membersLoading={membersLoading}
            defaultCoordinatorId={coordinatorId}
            onCreated={() => {
              setShowManualForm(false);
              void load();
            }}
            onCancel={() => setShowManualForm(false)}
          />
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-4">
        <input
          type="search"
          placeholder="Search name, email, phone, ZIP, lead id…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-xl border border-nurture-sage/30 px-4 py-2.5 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage sm:max-w-sm"
        />

        <div className="flex flex-wrap gap-2">
          {(
            [
              ["active", "Active queue"],
              ["archived", "Archived"],
              ["all", "All records"],
            ] as const
          ).map(([filter, label]) => (
            <button
              key={filter}
              type="button"
              onClick={() => setQueueFilter(filter)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                queueFilter === filter
                  ? "bg-nurture-charcoal text-white"
                  : "bg-nurture-cream text-nurture-charcoal/70 hover:bg-nurture-sage/10"
              }`}
            >
              {label}{" "}
              <span className="opacity-75">
                ({filter === "archived" ? counts.archived : counts.all})
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "Everyone"],
              ["guest", "Guest leads"],
              ["member", "Members"],
            ] as const
          ).map(([filter, label]) => (
            <button
              key={filter}
              type="button"
              onClick={() => setTypeFilter(filter)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                typeFilter === filter
                  ? "bg-nurture-sage text-white"
                  : "bg-nurture-cream text-nurture-charcoal/70 hover:bg-nurture-sage/10"
              }`}
            >
              {label}{" "}
              <span className="opacity-75">
                ({filter === "all" ? counts.all : counts[filter]})
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "All assignments"],
              ["mine", "Assigned to me"],
              ["unassigned", "Unassigned"],
            ] as const
          ).map(([filter, label]) => (
            <button
              key={filter}
              type="button"
              onClick={() => setAssignmentFilter(filter)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                assignmentFilter === filter
                  ? "bg-nurture-rose text-white"
                  : "bg-nurture-cream text-nurture-charcoal/70 hover:bg-nurture-rose/10"
              }`}
            >
              {label}{" "}
              <span className="opacity-75">({counts[filter] ?? 0})</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {(["all", "new", "intake_in_progress", "intake_completed", "consult_scheduled"] as StatusFilter[]).map(
            (filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === filter
                    ? "border border-nurture-sage bg-white text-nurture-sage-dark"
                    : "bg-white text-nurture-charcoal/70 hover:bg-nurture-sage/10"
                }`}
              >
                {filter === "all" ? "Any status" : STATUS_LABELS[filter as LeadStatus]}{" "}
                <span className="opacity-75">({counts[filter] ?? 0})</span>
              </button>
            )
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-nurture-sage/25 bg-nurture-cream/40 p-10 text-center">
          <p className="font-medium text-nurture-charcoal">No records found</p>
          <p className="mt-2 text-sm text-nurture-charcoal/60">
            {queueFilter === "archived"
              ? "Archived leads and completed intakes appear here after you remove them from the queue."
              : "Guest leads and member intakes appear here when someone starts the AI concierge."}
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((lead) => {
            const expanded = expandedId === lead.leadId;
            const notes = notesByLead[lead.leadId] ?? [];
            const prep = prepByLead[lead.leadId];
            const intake = intakeByLead[lead.leadId];
            const recommendations = recommendationsByLead[lead.leadId] ?? [];
            const linkedClient = linkedClientByLead[lead.leadId];
            const coordinatorLabel = getCoordinatorDisplayName(lead, members);
            const stageLabel = lead.maternalStage
              ? MATERNAL_STAGE_LABELS[lead.maternalStage as MaternalStage] ??
                lead.maternalStage
              : "—";

            return (
              <div
                key={lead.leadId}
                className={`overflow-hidden rounded-2xl border border-l-4 bg-white shadow-sm ${statusCardAccentClass(lead.status)} ${
                  lead.archivedAt
                    ? "border-nurture-charcoal/15 opacity-90"
                    : "border-nurture-sage/15"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleExpand(lead)}
                  className="flex w-full flex-col gap-3 p-4 text-left sm:flex-row sm:items-center sm:justify-between sm:p-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-nurture-charcoal">
                        {lead.name || "Unnamed"}
                      </p>
                      {lead.isGuest ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                          Guest lead
                        </span>
                      ) : (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-800">
                          Member
                        </span>
                      )}
                      {lead.archivedAt ? (
                        <span className="rounded-full bg-nurture-charcoal/10 px-2 py-0.5 text-xs text-nurture-charcoal/70">
                          Archived
                        </span>
                      ) : null}
                      {lead.source.startsWith("manual_") ? (
                        <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-800">
                          Manual · {formatLeadSource(lead.source)}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-sm text-nurture-charcoal/65">
                      {lead.email || "No email"}
                      {lead.phone ? ` · ${lead.phone}` : ""}
                      {lead.locationZip ? ` · ${lead.locationZip}` : ""}
                    </p>
                    <p className="mt-1 text-xs font-medium text-nurture-charcoal/55">
                      Coordinator:{" "}
                      <span
                        className={
                          lead.coordinatorId || lead.coordinatorEmail
                            ? "text-nurture-sage-dark"
                            : "text-amber-700"
                        }
                      >
                        {coordinatorLabel}
                      </span>
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2 sm:items-end">
                    <LeadStatusBadge status={lead.status} />
                    <div className="flex flex-wrap items-center justify-end gap-3 text-sm text-nurture-charcoal/60">
                      <span className="hidden sm:inline">{coordinatorLabel}</span>
                      <span>{stageLabel}</span>
                      <span>{lead.completionScore}%</span>
                      <span>{formatDate(lead.updatedAt)}</span>
                      <span aria-hidden>{expanded ? "▲" : "▼"}</span>
                    </div>
                  </div>
                </button>

                {expanded ? (
                  <div className="border-t border-nurture-sage/10 bg-nurture-cream/30 px-5 py-5">
                    <LeadSnapshotPanel
                      lead={lead}
                      intake={intake}
                      disabled={savingId === lead.leadId}
                      onSaved={(updated) => {
                        setLeads((current) =>
                          current.map((item) =>
                            item.leadId === updated.leadId ? updated : item
                          )
                        );
                      }}
                    />

                    <div className="mb-5 max-w-md">
                      <LeadCoordinatorSelect
                        value={lead.coordinatorId}
                        members={members}
                        membersLoading={membersLoading}
                        disabled={savingId === lead.leadId}
                        onChange={(nextCoordinatorId) =>
                          handleCoordinatorChange(lead.leadId, nextCoordinatorId)
                        }
                      />
                    </div>

                    <LeadContactEditForm
                      lead={lead}
                      disabled={savingId === lead.leadId}
                      onSaved={(updated) => {
                        setLeads((current) =>
                          current.map((item) =>
                            item.leadId === updated.leadId ? updated : item
                          )
                        );
                      }}
                    />

                    <div className="mb-5 flex flex-wrap gap-2">
                      {!lead.archivedAt ? (
                        <>
                          <div className="mb-1 w-full">
                            <p className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/50">
                              Current pipeline stage
                            </p>
                            <div
                              className={`mt-3 flex items-center gap-3 rounded-2xl px-5 py-4 shadow-md ring-2 ring-offset-2 ${statusBadgeClass(lead.status)} ${statusRingClass(lead.status)}`}
                            >
                              <span
                                className="h-4 w-4 shrink-0 rounded-full bg-white/90 shadow-sm"
                                aria-hidden
                              />
                              <p className="text-lg font-bold uppercase tracking-wide text-white">
                                {STATUS_LABELS[lead.status]}
                              </p>
                            </div>
                          </div>
                          {pipelineActionsForLead(lead).length > 0 ? (
                            <div className="w-full">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/50">
                                Move to
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {pipelineActionsForLead(lead).map((status) => (
                                  <button
                                    key={status}
                                    type="button"
                                    disabled={savingId === lead.leadId}
                                    onClick={() =>
                                      handleStatusChange(lead.leadId, status)
                                    }
                                    className="rounded-full border border-nurture-sage/25 bg-white px-3 py-1.5 text-xs font-medium text-nurture-charcoal/75 transition hover:border-nurture-sage/50 hover:bg-nurture-sage/10 disabled:opacity-50"
                                  >
                                    {STATUS_LABELS[status]}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="w-full text-sm text-nurture-charcoal/55">
                              This lead is in a terminal status — no further pipeline
                              moves are available.
                            </p>
                          )}
                          <button
                            type="button"
                            disabled={savingId === lead.leadId}
                            onClick={() => handleArchive(lead.leadId)}
                            className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                          >
                            Remove from queue
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled={savingId === lead.leadId}
                          onClick={() => handleRestore(lead.leadId)}
                          className="rounded-full border border-nurture-sage/30 px-4 py-2 text-xs font-semibold text-nurture-sage-dark hover:bg-nurture-sage/10 disabled:opacity-50"
                        >
                          Restore to queue
                        </button>
                      )}
                    </div>

                    {detailLoadingId === lead.leadId ? (
                      <p className="mb-5 text-sm text-nurture-charcoal/55">
                        Loading details…
                      </p>
                    ) : (
                      <>
                        {prep ? (
                          <div className="mb-5 rounded-xl border border-violet-200/60 bg-violet-50/40 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <p className="text-xs font-semibold uppercase tracking-wide text-violet-900/70">
                                Call prep — concierge summary
                              </p>
                              <p className="text-xs text-nurture-charcoal/50">
                                {prep.messageCount} messages
                                {prep.updatedAt ? ` · ${formatDate(prep.updatedAt)}` : ""}
                              </p>
                            </div>
                            <p className="mt-3 text-sm leading-relaxed text-nurture-charcoal/85">
                              {prep.narrativeSummary}
                            </p>
                            {prep.summaryBullets.length > 0 ? (
                              <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-nurture-charcoal/75">
                                {prep.summaryBullets.map((bullet) => (
                                  <li key={bullet}>{bullet}</li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        ) : null}

                        {!lead.isGuest && intake ? (
                          <MemberIntakePanel
                            intake={intake}
                            recommendations={recommendations}
                            saving={savingId === lead.leadId}
                            onIntakeStatusChange={(status) =>
                              handleIntakeStatusChange(lead, status)
                            }
                          />
                        ) : null}

                        <ConversationAdminPanel
                          lead={lead}
                          sessions={conversationsByLead[lead.leadId] ?? []}
                          loading={conversationsLoadingId === lead.leadId}
                          reopeningKey={reopeningKey}
                          onRefresh={() => loadConversations(lead)}
                          onReopen={(sessionId) =>
                            handleReopenConversation(lead, sessionId)
                          }
                        />

                        <ProposalPanel
                          clientId={linkedClient?.clientId ?? lead.leadId}
                          signerEmail={lead.email}
                          readOnly
                        />

                        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-nurture-sage/15 bg-white px-4 py-3">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/50">
                              Client CRM
                            </p>
                            {linkedClient === undefined ? (
                              <p className="mt-0.5 text-sm text-nurture-charcoal/55">
                                Checking for linked client…
                              </p>
                            ) : linkedClient ? (
                              <p className="mt-0.5 text-sm text-nurture-charcoal/70">
                                Linked to client{" "}
                                <span className="font-medium text-nurture-charcoal">
                                  {linkedClient.name || linkedClient.clientId}
                                </span>
                                . Manage proposals, billing, and communications in
                                Client CRM.
                              </p>
                            ) : (
                              <p className="mt-0.5 text-sm text-nurture-charcoal/70">
                                This is a lead only. Convert to a managed client to
                                track billing, proposals, and communications.
                              </p>
                            )}
                          </div>
                          {linkedClient ? (
                            <Link
                              href="/admin/clients"
                              className="ml-auto rounded-full border border-nurture-sage/30 px-4 py-2 text-xs font-semibold text-nurture-sage-dark transition hover:bg-nurture-sage/10"
                            >
                              Open Client CRM
                            </Link>
                          ) : (
                            <button
                              type="button"
                              disabled={
                                convertingId === lead.leadId ||
                                linkedClient === undefined
                              }
                              onClick={() => handleConvertToClient(lead.leadId)}
                              className="ml-auto rounded-full bg-nurture-sage px-4 py-2 text-xs font-semibold text-white transition hover:bg-nurture-sage-dark disabled:opacity-60"
                            >
                              {convertingId === lead.leadId
                                ? "Converting…"
                                : "Convert to client"}
                            </button>
                          )}
                        </div>

                        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                          <DetailItem label="Lead ID" value={lead.leadId} />
                          <DetailItem
                            label="Type"
                            value={lead.isGuest ? "Guest lead (no account)" : "Member account"}
                          />
                          <DetailItem
                            label="Coordinator"
                            value={getCoordinatorDisplayName(lead, members)}
                          />
                          <DetailItem label="Source" value={formatLeadSource(lead.source)} />
                          <DetailItem label="Intake status" value={lead.intakeStatus || intake?.intakeStatus || "—"} />
                          <DetailItem label="ZIP" value={lead.locationZip || intake?.locationZip || "—"} />
                          <DetailItem
                            label="Support interests"
                            value={
                              (intake?.supportInterests.length
                                ? intake.supportInterests
                                    .map(
                                      (item) =>
                                        SUPPORT_INTEREST_LABELS[
                                          item as SupportInterest
                                        ] ?? item
                                    )
                                    .join(", ")
                                : null) ||
                              lead.supportInterests.join(", ") ||
                              "—"
                            }
                          />
                          <DetailItem
                            label="Challenges"
                            value={
                              intake?.challengesFreeText ||
                              lead.challengesSummary ||
                              "—"
                            }
                          />
                          {intake ? (
                            <>
                              <DetailItem
                                label="Insurance"
                                value={
                                  intake.insuranceProvider ||
                                  (intake.insuranceInterested === true
                                    ? "Interested in coverage"
                                    : intake.insuranceInterested === false
                                      ? "Not using insurance"
                                      : "—")
                                }
                              />
                              <DetailItem
                                label="Budget"
                                value={intake.budgetPreference ?? "—"}
                              />
                              <DetailItem
                                label="Schedule"
                                value={
                                  [
                                    intake.preferredSchedule.days.join(", ") || null,
                                    intake.preferredSchedule.times.join(", ") || null,
                                    intake.preferredSchedule.modality,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ") || "—"
                                }
                              />
                            </>
                          ) : null}
                        </dl>
                      </>
                    )}

                    <div className="mt-6 rounded-xl border border-nurture-sage/15 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/50">
                        Coordinator notes
                      </p>

                      {notes.length === 0 ? (
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
                          placeholder="Prep for the call, log outcomes, or plan follow-up…"
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

const MemberIntakePanel = ({
  intake,
  recommendations,
  saving,
  onIntakeStatusChange,
}: {
  intake: IntakeProfile;
  recommendations: CareRecommendation[];
  saving: boolean;
  onIntakeStatusChange: (status: IntakeStatus) => void;
}) => (
  <div className="mb-5 space-y-4">
    <div className="rounded-xl border border-nurture-sage/15 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/50">
        Member intake status
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {INTAKE_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            disabled={saving}
            onClick={() => onIntakeStatusChange(status)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
              intake.intakeStatus === status
                ? "bg-nurture-sage text-white shadow-sm"
                : "border border-nurture-sage/25 bg-nurture-cream/50 text-nurture-charcoal/75 hover:border-nurture-sage/50"
            }`}
          >
            {INTAKE_STATUS_LABELS[status]}
          </button>
        ))}
      </div>
    </div>

    {recommendations.length > 0 ? (
      <div className="rounded-xl border border-nurture-sage/15 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/50">
          Care recommendations
        </p>
        <ul className="mt-2 space-y-2">
          {recommendations.map((rec) => (
            <li key={rec.id} className="rounded-xl bg-nurture-cream/40 p-3 text-sm">
              <span className="font-medium">
                {SUPPORT_INTEREST_LABELS[rec.recommendationType as SupportInterest] ??
                  rec.recommendationType}
              </span>
              <span className="text-nurture-charcoal/50"> · P{rec.priorityLevel}</span>
              <p className="mt-1 text-nurture-charcoal/70">{rec.recommendationReason}</p>
            </li>
          ))}
        </ul>
      </div>
    ) : null}
  </div>
);

const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className="text-xs font-semibold uppercase tracking-wide text-nurture-charcoal/45">
      {label}
    </dt>
    <dd className="mt-1 text-sm text-nurture-charcoal/80">{value}</dd>
  </div>
);

export default LeadQueue;
