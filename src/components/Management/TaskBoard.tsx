"use client";

import {
  createTask,
  deleteTask,
  disconnectGoogleTasks,
  fetchGoogleTasksConnection,
  fetchGoogleTasksStatus,
  fetchTasks,
  fetchTeamMembers,
  startGoogleTasksConnect,
  syncGoogleTasks,
  updateTask,
} from "@/lib/api/tasksClient";
import {
  countOverdue,
  dueStatusStyles,
  formatDueDate,
  formatAssignees,
  getDueStatus,
  getInitials,
  getUserAssigneeMatchers,
  taskAssignedToUser,
} from "@/lib/tasks/utils";
import { buildOpenTaskReport } from "@/lib/tasks/reportData";
import { exportOpenTasksToExcel } from "@/lib/tasks/exportExcel";
import { exportOpenTasksToPdf } from "@/lib/tasks/exportPdf";
import {
  describePullSyncResult,
  describePushSyncResult,
  describeRecreateSyncResult,
  getGooglePushEligibility,
  googleTasksDestinationHint,
} from "@/lib/tasks/googleSyncFeedback";
import type {
  CreateTaskInput,
  ManagementTask,
  TaskFilter,
  TaskOwnershipFilter,
  TaskViewMode,
} from "@/types/task";
import type { TeamMember } from "@/types/teamMember";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import TaskFormModal from "./TaskFormModal";
import TaskCalendar from "./TaskCalendar";
import UrgentFlag from "./UrgentFlag";

interface TaskBoardProps {
  userEmail?: string;
  userDisplayName?: string;
}

const statusFilters: { id: TaskFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "In progress" },
  { id: "urgent", label: "Urgent" },
  { id: "completed", label: "Done" },
];

const ownershipFilters: { id: TaskOwnershipFilter; label: string }[] = [
  { id: "all", label: "All tasks" },
  { id: "mine", label: "My tasks" },
];

const viewModes: { id: TaskViewMode; label: string }[] = [
  { id: "board", label: "Board" },
  { id: "calendar", label: "Calendar" },
];

const TaskBoard = ({ userEmail, userDisplayName }: TaskBoardProps) => {
  const [tasks, setTasks] = useState<ManagementTask[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [ownershipFilter, setOwnershipFilter] =
    useState<TaskOwnershipFilter>("all");
  const [viewMode, setViewMode] = useState<TaskViewMode>("board");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ManagementTask | null>(null);
  const [defaultDueDate, setDefaultDueDate] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);
  const [googleTasksEnabled, setGoogleTasksEnabled] = useState(false);
  const [googlePersonalSync, setGooglePersonalSync] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleConnecting, setGoogleConnecting] = useState(false);
  const [googleSyncing, setGoogleSyncing] = useState(false);
  const [googleDelegatedUser, setGoogleDelegatedUser] = useState<string | null>(
    null
  );
  const [googleTaskListTitle, setGoogleTaskListTitle] = useState<string | null>(
    null
  );
  const [googleSyncNotice, setGoogleSyncNotice] = useState<string | null>(null);

  const reportScopeLabel =
    ownershipFilter === "mine" ? "My open tasks" : "All open tasks";

  const loadTasks = useCallback(async (): Promise<ManagementTask[]> => {
    setLoading(true);
    try {
      const data = await fetchTasks();
      setTasks(data);
      return data;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not load tasks"
      );
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      const data = await fetchTeamMembers();
      setMembers(data.members);
      if (data.partial && data.message) {
        toast(data.message, { icon: "ℹ️" });
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not load team members"
      );
    } finally {
      setMembersLoading(false);
    }
  }, []);

  const showSyncToast = useCallback(
    (tone: "success" | "error" | "info", message: string) => {
      setGoogleSyncNotice(message);
      if (tone === "success") toast.success(message);
      else if (tone === "error") toast.error(message);
      else toast(message, { icon: "ℹ️" });
    },
    []
  );

  const pullFromGoogle = useCallback(async (silent = false) => {
    setGoogleSyncing(true);
    try {
      const result = await syncGoogleTasks({ action: "pull" });
      await loadTasks();
      if (!silent) {
        const feedback = describePullSyncResult(result.pull);
        showSyncToast(feedback.tone, feedback.message);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not pull from Google Tasks";
      setGoogleSyncNotice(message);
      if (!silent) {
        toast.error(message);
      }
    } finally {
      setGoogleSyncing(false);
    }
  }, [loadTasks, showSyncToast]);

  const loadGoogleSyncState = useCallback(async () => {
    try {
      const [status, connection] = await Promise.all([
        fetchGoogleTasksStatus(),
        fetchGoogleTasksConnection(),
      ]);
      const enabled = status.googleTasks.enabled;
      setGoogleTasksEnabled(enabled);
      setGooglePersonalSync(
        connection.personalSync || status.googleTasks.personalSync === true
      );
      setGoogleConnected(connection.connected);
      setGoogleDelegatedUser(status.googleTasks.delegatedUser ?? null);
      setGoogleTaskListTitle(status.googleTasks.taskListTitle ?? null);
      return {
        enabled,
        connected: connection.connected,
        personal: connection.personalSync,
      };
    } catch {
      setGoogleTasksEnabled(false);
      setGooglePersonalSync(false);
      setGoogleConnected(false);
      return { enabled: false, connected: false, personal: false };
    }
  }, []);

  const handleConnectGoogleTasks = async () => {
    setGoogleConnecting(true);
    try {
      const { authorizeUrl } = await startGoogleTasksConnect();
      window.location.assign(authorizeUrl);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not start Google connection"
      );
      setGoogleConnecting(false);
    }
  };

  const handleDisconnectGoogleTasks = async () => {
    setGoogleSyncing(true);
    try {
      await disconnectGoogleTasks();
      setGoogleConnected(false);
      toast.success("Google Tasks disconnected");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not disconnect Google Tasks"
      );
    } finally {
      setGoogleSyncing(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadTasks();
      await loadMembers();
      const syncState = await loadGoogleSyncState();
      if (syncState.enabled && (!syncState.personal || syncState.connected)) {
        await pullFromGoogle(true);
      }
    };
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const google = params.get("google");
    if (!google) return;
    if (google === "connected") {
      toast.success("Google Tasks connected — your list will stay in sync");
      void loadGoogleSyncState().then((state) => {
        if (state.connected) void pullFromGoogle(true);
      });
    } else if (google === "error") {
      toast.error(params.get("message") || "Google Tasks connection failed");
    }
    params.delete("google");
    params.delete("message");
    const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
    window.history.replaceState({}, "", next);
  }, [loadGoogleSyncState, pullFromGoogle]);

  const currentMember = useMemo(
    () =>
      members.find(
        (member) =>
          member.email === userEmail ||
          member.username === userDisplayName ||
          member.label === userDisplayName
      ) ?? null,
    [members, userEmail, userDisplayName]
  );

  const defaultAssignees = useMemo(() => {
    if (currentMember) return [currentMember.label];
    const fallback = userDisplayName ?? userEmail?.split("@")[0];
    return fallback ? [fallback] : members[0] ? [members[0].label] : [];
  }, [currentMember, members, userEmail, userDisplayName]);

  const userAssigneeMatchers = useMemo(
    () => getUserAssigneeMatchers(userEmail, userDisplayName, currentMember),
    [userEmail, userDisplayName, currentMember]
  );

  const ownershipScopedTasks = useMemo(() => {
    if (ownershipFilter === "all") return tasks;
    return tasks.filter((task) =>
      taskAssignedToUser(task, userAssigneeMatchers)
    );
  }, [tasks, ownershipFilter, userAssigneeMatchers]);

  const filtered = useMemo(() => {
    return ownershipScopedTasks.filter((task) => {
      if (filter === "active") return !task.completed;
      if (filter === "completed") return task.completed;
      if (filter === "urgent") return task.urgent && !task.completed;
      return true;
    });
  }, [ownershipScopedTasks, filter]);

  const stats = useMemo(() => {
    const total = ownershipScopedTasks.length;
    const done = ownershipScopedTasks.filter((task) => task.completed).length;
    const overdue = countOverdue(ownershipScopedTasks);
    const urgent = ownershipScopedTasks.filter(
      (task) => task.urgent && !task.completed
    ).length;
    return { total, done, active: total - done, overdue, urgent };
  }, [ownershipScopedTasks]);

  const handleCreateOrUpdate = async (input: CreateTaskInput) => {
    if (editing) {
      const updated = await updateTask(editing.id, input);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      toast.success("Task updated");
    } else {
      const created = await createTask(input);
      setTasks((prev) => [created, ...prev]);
      toast.success("Task added");
    }
  };

  const toggleComplete = async (task: ManagementTask) => {
    try {
      const updated = await updateTask(task.id, {
        completed: !task.completed,
      });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      toast.success(updated.completed ? "Marked complete" : "Reopened");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update task"
      );
    }
  };

  const handleDelete = async (task: ManagementTask) => {
    if (!window.confirm(`Delete “${task.title}”?`)) return;
    try {
      await deleteTask(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      toast.success("Task deleted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not delete task"
      );
    }
  };

  const toggleUrgent = async (task: ManagementTask) => {
    try {
      const updated = await updateTask(task.id, { urgent: !task.urgent });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      toast.success(updated.urgent ? "Marked urgent" : "Urgent flag removed");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update task"
      );
    }
  };

  const openTaskCount = useMemo(
    () => ownershipScopedTasks.filter((task) => !task.completed).length,
    [ownershipScopedTasks]
  );

  const handleExport = async (format: "excel" | "pdf") => {
    const report = buildOpenTaskReport(ownershipScopedTasks, reportScopeLabel);
    if (report.openCount === 0) {
      toast.error("No open tasks to export");
      return;
    }

    setExporting(format);
    try {
      if (format === "excel") {
        exportOpenTasksToExcel(report, reportScopeLabel);
        toast.success("Excel report downloaded");
      } else {
        const method = await exportOpenTasksToPdf(report, reportScopeLabel);
        if (method === "preview-tab") {
          toast.success("Report opened — use Print / Save as PDF in the new tab");
        } else if (method === "iframe-print") {
          toast.success("Print dialog opened — choose Save as PDF to export");
        } else {
          toast.success(
            "Report downloaded as HTML — open it and use Print / Save as PDF"
          );
        }
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not export report"
      );
    } finally {
      setExporting(null);
    }
  };

  const openEdit = (task: ManagementTask) => {
    setEditing(task);
    setDefaultDueDate(null);
    setModalOpen(true);
  };

  const openNew = (dueDate?: string | null) => {
    setEditing(null);
    setDefaultDueDate(dueDate ?? null);
    setModalOpen(true);
  };

  const handleRecreateGoogleTasks = async () => {
    const confirmed = window.confirm(
      "Clear all Google task links and re-push internal tasks? Use this if you deleted the Google Tasks list."
    );
    if (!confirmed) return;

    setGoogleSyncing(true);
    try {
      const result = await syncGoogleTasks({ action: "recreate" });
      const refreshedTasks = await loadTasks();
      const migrate = result.migrate;
      const feedback = describeRecreateSyncResult({
        migrated: migrate?.migrated ?? 0,
        skipped: migrate?.skipped ?? 0,
        errors: migrate?.errors ?? [],
        linksCleared:
          (result.linksCleared ?? 0) + (migrate?.linksCleared ?? 0),
        listReset: Boolean(result.listReset),
        eligibility: getGooglePushEligibility(
          refreshedTasks,
          userAssigneeMatchers
        ),
      });
      showSyncToast(feedback.tone, feedback.message);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not recreate Google Tasks";
      setGoogleSyncNotice(message);
      toast.error(message);
    } finally {
      setGoogleSyncing(false);
    }
  };

  const handleGoogleSync = async (action: "pull" | "migrate" | "both") => {
    if (action === "pull") {
      await pullFromGoogle(false);
      return;
    }
    setGoogleSyncing(true);
    try {
      const result = await syncGoogleTasks({ action });
      const refreshedTasks = await loadTasks();
      if (action === "migrate" || action === "both") {
        const pushFeedback = describePushSyncResult(
          result.migrate,
          getGooglePushEligibility(refreshedTasks, userAssigneeMatchers)
        );
        showSyncToast(pushFeedback.tone, pushFeedback.message);
      }
      if (action === "both" && result.pull) {
        const pullFeedback = describePullSyncResult(result.pull);
        if (pullFeedback.tone === "success") {
          toast.success(pullFeedback.message);
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not sync Google Tasks";
      setGoogleSyncNotice(message);
      toast.error(message);
    } finally {
      setGoogleSyncing(false);
    }
  };

  const googleDestinationHint = googleTasksDestinationHint({
    personalSync: googlePersonalSync,
    delegatedUser: googleDelegatedUser,
    taskListTitle: googleTaskListTitle,
    connected: googleConnected,
  });

  const pushEligibility = useMemo(
    () => getGooglePushEligibility(tasks),
    [tasks]
  );

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-nurture-sage via-nurture-sage-dark to-nurture-charcoal p-8 text-white shadow-lg md:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-nurture-blush/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              Internal ops
            </p>
            <h1 className="mt-2 font-serif text-3xl font-semibold md:text-4xl">
              Team task board
            </h1>
            <p className="mt-3 max-w-xl text-sm text-white/85 md:text-base">
              Shared checklist for the management team — deadlines, ownership,
              and progress in one place.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openNew()}
            className="shrink-0 rounded-full bg-white px-6 py-3 text-sm font-semibold text-nurture-sage-dark shadow-md transition hover:scale-[1.02] hover:shadow-lg"
          >
            + Add task
          </button>
        </div>
        <div className="relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: "Total", value: stats.total, filterId: null },
            { label: "In progress", value: stats.active, filterId: "active" as const },
            { label: "Urgent", value: stats.urgent, filterId: "urgent" as const },
            { label: "Completed", value: stats.done, filterId: "completed" as const },
            { label: "Overdue", value: stats.overdue, filterId: null },
          ].map((stat) => {
            const isActiveFilter = stat.filterId !== null && filter === stat.filterId;
            const Wrapper = stat.filterId ? "button" : "div";

            return (
              <Wrapper
                key={stat.label}
                type={stat.filterId ? "button" : undefined}
                onClick={
                  stat.filterId
                    ? () => setFilter(stat.filterId!)
                    : undefined
                }
                className={`rounded-2xl border px-4 py-3 backdrop-blur text-left transition ${
                  isActiveFilter
                    ? "border-white bg-white/25 ring-2 ring-white/40"
                    : "border-white/20 bg-white/10"
                } ${stat.filterId ? "cursor-pointer hover:bg-white/20" : ""}`}
              >
                <p className="text-2xl font-semibold tabular-nums">{stat.value}</p>
                <p
                  className={`text-xs uppercase tracking-wide ${
                    stat.label === "Urgent" && stat.value > 0
                      ? "text-red-200"
                      : "text-white/70"
                  }`}
                >
                  {stat.label}
                </p>
              </Wrapper>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-full border border-nurture-sage/25 bg-white p-1 shadow-sm">
            {viewModes.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setViewMode(option.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  viewMode === option.id
                    ? "bg-nurture-charcoal text-white shadow-sm"
                    : "text-nurture-charcoal/70 hover:text-nurture-sage-dark"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="inline-flex rounded-full border border-nurture-sage/25 bg-white p-1 shadow-sm">
            {ownershipFilters.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setOwnershipFilter(option.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  ownershipFilter === option.id
                    ? "bg-nurture-charcoal text-white shadow-sm"
                    : "text-nurture-charcoal/70 hover:text-nurture-sage-dark"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="inline-flex rounded-full border border-nurture-sage/25 bg-white p-1 shadow-sm">
            {statusFilters.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setFilter(option.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  filter === option.id
                    ? option.id === "urgent"
                      ? "bg-red-600 text-white shadow-sm"
                      : "bg-nurture-sage text-white shadow-sm"
                    : "text-nurture-charcoal/70 hover:text-nurture-sage-dark"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="inline-flex rounded-full border border-nurture-sage/25 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => void handleExport("excel")}
              disabled={loading || exporting !== null || openTaskCount === 0}
              className="rounded-full px-4 py-2 text-sm font-medium text-nurture-charcoal/75 transition hover:bg-nurture-sage/10 hover:text-nurture-sage-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exporting === "excel" ? "Exporting…" : "Export Excel"}
            </button>
            <button
              type="button"
              onClick={() => void handleExport("pdf")}
              disabled={loading || exporting !== null || openTaskCount === 0}
              className="rounded-full px-4 py-2 text-sm font-medium text-nurture-charcoal/75 transition hover:bg-nurture-sage/10 hover:text-nurture-sage-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exporting === "pdf" ? "Opening…" : "Export PDF"}
            </button>
          </div>
          {googleTasksEnabled ? (
            <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-nurture-sage/25 bg-white p-1 shadow-sm">
              {googlePersonalSync && !googleConnected ? (
                <button
                  type="button"
                  onClick={() => void handleConnectGoogleTasks()}
                  disabled={loading || googleConnecting}
                  className="rounded-full px-4 py-2 text-sm font-medium text-nurture-charcoal/75 transition hover:bg-nurture-sage/10 hover:text-nurture-sage-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {googleConnecting ? "Connecting…" : "Connect Google Tasks"}
                </button>
              ) : null}
              {(!googlePersonalSync || googleConnected) ? (
                <>
                  <button
                    type="button"
                    onClick={() => void handleGoogleSync("pull")}
                    disabled={loading || googleSyncing}
                    className="rounded-full px-4 py-2 text-sm font-medium text-nurture-charcoal/75 transition hover:bg-nurture-sage/10 hover:text-nurture-sage-dark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {googleSyncing ? "Syncing…" : "Sync from Google"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleGoogleSync("migrate")}
                    disabled={loading || googleSyncing}
                    className="rounded-full px-4 py-2 text-sm font-medium text-nurture-charcoal/75 transition hover:bg-nurture-sage/10 hover:text-nurture-sage-dark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Push to Google
                  </button>
                  {pushEligibility.alreadyLinked > 0 &&
                  pushEligibility.eligible === 0 ? (
                    <button
                      type="button"
                      onClick={() => void handleRecreateGoogleTasks()}
                      disabled={loading || googleSyncing}
                      className="rounded-full px-4 py-2 text-sm font-medium text-nurture-charcoal/75 transition hover:bg-amber-50 hover:text-amber-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Re-create in Google
                    </button>
                  ) : null}
                </>
              ) : null}
              {googlePersonalSync && googleConnected ? (
                <button
                  type="button"
                  onClick={() => void handleDisconnectGoogleTasks()}
                  disabled={loading || googleSyncing}
                  className="rounded-full px-4 py-2 text-sm font-medium text-nurture-charcoal/55 transition hover:bg-nurture-sage/10 hover:text-nurture-charcoal disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Disconnect
                </button>
              ) : null}
            </div>
          ) : null}
          <button
            type="button"
            onClick={loadTasks}
            className="text-sm font-medium text-nurture-sage-dark hover:underline"
          >
            Refresh
          </button>
        </div>
      </div>

      {googleTasksEnabled && googleDestinationHint ? (
        <p className="text-xs text-nurture-charcoal/60">{googleDestinationHint}</p>
      ) : null}

      {googleTasksEnabled && !loading ? (
        <p className="text-xs text-nurture-charcoal/55">
          {pushEligibility.eligible} in-progress task
          {pushEligibility.eligible === 1 ? "" : "s"} assigned to you ready for Google
          {pushEligibility.alreadyLinked > 0
            ? ` · ${pushEligibility.alreadyLinked} linked in app${
                pushEligibility.eligible === 0
                  ? " (use Re-create in Google if you deleted the list)"
                  : ""
              }`
            : ""}
          {pushEligibility.clientTasks > 0
            ? ` · ${pushEligibility.clientTasks} client (not synced to Google)`
            : ""}
        </p>
      ) : null}

      {googleSyncNotice ? (
        <div
          role="status"
          className="rounded-xl border border-nurture-sage/20 bg-nurture-sage/5 px-4 py-3 text-sm text-nurture-charcoal/80"
        >
          {googleSyncNotice}
        </div>
      ) : null}

      {!loading && openTaskCount > 0 ? (
        <p className="text-xs text-nurture-charcoal/55">
          Export includes {openTaskCount} open task{openTaskCount === 1 ? "" : "s"}{" "}
          ({reportScopeLabel.toLowerCase()}) with branding and confidentiality
          notices for printed reports.
        </p>
      ) : null}

      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-nurture-sage/30 bg-white/60">
          <p className="text-nurture-charcoal/50">Loading tasks…</p>
        </div>
      ) : viewMode === "calendar" ? (
        <TaskCalendar
          tasks={filtered}
          onTaskClick={openEdit}
          onDayClick={(dateKey) => openNew(dateKey)}
        />
      ) : filtered.length === 0 ? (
        <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-nurture-sage/30 bg-white/80 p-8 text-center">
          <p className="font-serif text-xl text-nurture-charcoal">
            {filter === "urgent"
              ? "No urgent tasks"
              : ownershipFilter === "mine" && filter !== "all"
                ? "No tasks match this view"
                : ownershipFilter === "mine"
                  ? "No tasks assigned to you"
                  : filter === "all"
                    ? "No tasks yet"
                    : "Nothing in this view"}
          </p>
          <p className="mt-2 max-w-sm text-sm text-nurture-charcoal/60">
            {filter === "urgent"
              ? "Urgent tasks will appear here when flagged. Mark a task urgent from the board or when creating it."
              : ownershipFilter === "mine"
                ? "Try switching to All tasks, or ask a teammate to add you as responsible on a task."
                : "Add the first item so your team can track responsibilities and deadlines together."}
          </p>
          {ownershipFilter === "mine" ? (
            <button
              type="button"
              onClick={() => setOwnershipFilter("all")}
              className="mt-6 rounded-full border border-nurture-sage/30 px-6 py-2.5 text-sm font-medium text-nurture-sage-dark hover:bg-nurture-sage/10"
            >
              View all tasks
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openNew()}
              className="mt-6 rounded-full bg-nurture-sage px-6 py-2.5 text-sm font-medium text-white hover:bg-nurture-sage-dark"
            >
              Create a task
            </button>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((task) => {
            const dueStatus = getDueStatus(task.dueDate, task.completed);
            const styles = dueStatusStyles[dueStatus];

            return (
              <li
                key={task.id}
                className={`group relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
                  task.completed
                    ? "border-nurture-sage/15 opacity-80"
                    : task.urgent
                      ? "border-red-200 bg-red-50/40"
                      : "border-nurture-sage/20"
                }`}
              >
                <div
                  className={`absolute left-0 top-0 h-full w-1 ${
                    task.urgent && !task.completed ? "bg-red-500" : styles.dot
                  }`}
                />
                <div className="flex gap-4 pl-2">
                  <button
                    type="button"
                    onClick={() => toggleUrgent(task)}
                    aria-label={
                      task.urgent ? "Remove urgent flag" : "Mark as urgent"
                    }
                    title={task.urgent ? "Remove urgent flag" : "Mark as urgent"}
                    className={`mt-0.5 shrink-0 rounded-lg p-1 transition hover:bg-red-50 ${
                      task.urgent ? "text-red-600" : "text-nurture-charcoal/30 hover:text-red-500"
                    }`}
                  >
                    <UrgentFlag active={task.urgent} className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleComplete(task)}
                    aria-label={
                      task.completed ? "Mark incomplete" : "Mark complete"
                    }
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                      task.completed
                        ? "border-nurture-sage bg-nurture-sage text-white"
                        : "border-nurture-sage/50 hover:border-nurture-sage hover:bg-nurture-sage/10"
                    }`}
                  >
                    {task.completed && (
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-1 items-start gap-2">
                        <h3
                          className={`font-medium text-nurture-charcoal ${
                            task.completed
                              ? "line-through decoration-nurture-sage/50"
                              : ""
                          } ${task.urgent && !task.completed ? "text-red-900" : ""}`}
                        >
                          {task.title}
                        </h3>
                        {task.urgent && !task.completed ? (
                          <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700">
                            Urgent
                          </span>
                        ) : null}
                        {task.category === "client" ? (
                          <span className="shrink-0 rounded-full bg-nurture-sage/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-nurture-sage-dark">
                            {task.clickUpTaskId ? "ClickUp synced" : "Client · pending sync"}
                          </span>
                        ) : task.googleTaskId ? (
                          <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                            Google Tasks
                          </span>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(task)}
                          className="rounded-lg px-2 py-1 text-xs font-medium text-nurture-sage-dark opacity-100 transition hover:bg-nurture-sage/10 sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(task)}
                          className="rounded-lg px-2 py-1 text-xs font-medium text-red-600/80 opacity-100 transition hover:bg-red-50 sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {task.description ? (
                      <p className="mt-1.5 text-sm text-nurture-charcoal/65">
                        {task.description}
                      </p>
                    ) : null}

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {(task.assignees.length > 0
                            ? task.assignees
                            : ["?"]
                          )
                            .slice(0, 4)
                            .map((name) => (
                              <span
                                key={name}
                                title={name}
                                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-nurture-blush/50 text-xs font-semibold text-nurture-charcoal"
                              >
                                {getInitials(name)}
                              </span>
                            ))}
                        </div>
                        <span className="text-sm text-nurture-charcoal/80">
                          {formatAssignees(task.assignees)}
                          {task.assignees.length > 4
                            ? ` +${task.assignees.length - 4} more`
                            : ""}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${styles.badge}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${styles.dot}`}
                        />
                        {formatDueDate(task.dueDate)}
                      </span>
                      {task.completed && task.completedAt ? (
                        <span className="text-xs text-nurture-charcoal/45">
                          Done{" "}
                          {new Date(task.completedAt).toLocaleDateString()}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <TaskFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
          setDefaultDueDate(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initial={editing}
        members={members}
        membersLoading={membersLoading}
        defaultAssignees={defaultAssignees}
        defaultDueDate={defaultDueDate}
      />
    </div>
  );
};

export default TaskBoard;
