"use client";

import {
  createTask,
  deleteTask,
  fetchTasks,
  fetchTeamMembers,
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

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTasks();
      setTasks(data);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not load tasks"
      );
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

  useEffect(() => {
    loadTasks();
    loadMembers();
  }, [loadTasks, loadMembers]);

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
            { label: "Total", value: stats.total },
            { label: "In progress", value: stats.active },
            { label: "Urgent", value: stats.urgent },
            { label: "Completed", value: stats.done },
            { label: "Overdue", value: stats.overdue },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur"
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
            </div>
          ))}
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
                    ? "bg-nurture-sage text-white shadow-sm"
                    : "text-nurture-charcoal/70 hover:text-nurture-sage-dark"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={loadTasks}
          className="text-sm font-medium text-nurture-sage-dark hover:underline"
        >
          Refresh
        </button>
      </div>

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
            {ownershipFilter === "mine" && filter !== "all"
              ? "No tasks match this view"
              : ownershipFilter === "mine"
                ? "No tasks assigned to you"
                : filter === "all"
                  ? "No tasks yet"
                  : "Nothing in this view"}
          </p>
          <p className="mt-2 max-w-sm text-sm text-nurture-charcoal/60">
            {ownershipFilter === "mine"
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
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(task)}
                          className="rounded-lg px-2 py-1 text-xs font-medium text-nurture-sage-dark opacity-0 transition group-hover:opacity-100 hover:bg-nurture-sage/10"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(task)}
                          className="rounded-lg px-2 py-1 text-xs font-medium text-red-600/80 opacity-0 transition group-hover:opacity-100 hover:bg-red-50"
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
