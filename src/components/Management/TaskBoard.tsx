"use client";

import {
  createTask,
  deleteTask,
  fetchTasks,
  updateTask,
} from "@/lib/api/tasksClient";
import {
  countOverdue,
  dueStatusStyles,
  formatDueDate,
  getDueStatus,
  getInitials,
} from "@/lib/tasks/utils";
import type {
  CreateTaskInput,
  ManagementTask,
  TaskFilter,
} from "@/types/task";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import TaskFormModal from "./TaskFormModal";

interface TaskBoardProps {
  userEmail?: string;
}

const filters: { id: TaskFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "In progress" },
  { id: "completed", label: "Done" },
];

const TaskBoard = ({ userEmail }: TaskBoardProps) => {
  const [tasks, setTasks] = useState<ManagementTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ManagementTask | null>(null);

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

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const filtered = useMemo(() => {
    return tasks.filter((task) => {
      if (filter === "active") return !task.completed;
      if (filter === "completed") return task.completed;
      return true;
    });
  }, [tasks, filter]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.completed).length;
    const overdue = countOverdue(tasks);
    return { total, done, active: total - done, overdue };
  }, [tasks]);

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

  const openEdit = (task: ManagementTask) => {
    setEditing(task);
    setModalOpen(true);
  };

  const openNew = () => {
    setEditing(null);
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
            onClick={openNew}
            className="shrink-0 rounded-full bg-white px-6 py-3 text-sm font-semibold text-nurture-sage-dark shadow-md transition hover:scale-[1.02] hover:shadow-lg"
          >
            + Add task
          </button>
        </div>
        <div className="relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total", value: stats.total },
            { label: "In progress", value: stats.active },
            { label: "Completed", value: stats.done },
            { label: "Overdue", value: stats.overdue },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur"
            >
              <p className="text-2xl font-semibold tabular-nums">{stat.value}</p>
              <p className="text-xs uppercase tracking-wide text-white/70">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex rounded-full border border-nurture-sage/25 bg-white p-1 shadow-sm">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                filter === f.id
                  ? "bg-nurture-sage text-white shadow-sm"
                  : "text-nurture-charcoal/70 hover:text-nurture-sage-dark"
              }`}
            >
              {f.label}
            </button>
          ))}
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
      ) : filtered.length === 0 ? (
        <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-nurture-sage/30 bg-white/80 p-8 text-center">
          <p className="font-serif text-xl text-nurture-charcoal">
            {filter === "all" ? "No tasks yet" : "Nothing in this view"}
          </p>
          <p className="mt-2 max-w-sm text-sm text-nurture-charcoal/60">
            Add the first item so your team can track responsibilities and
            deadlines together.
          </p>
          <button
            type="button"
            onClick={openNew}
            className="mt-6 rounded-full bg-nurture-sage px-6 py-2.5 text-sm font-medium text-white hover:bg-nurture-sage-dark"
          >
            Create a task
          </button>
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
                    : "border-nurture-sage/20"
                }`}
              >
                <div
                  className={`absolute left-0 top-0 h-full w-1 ${styles.dot}`}
                />
                <div className="flex gap-4 pl-2">
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
                      <h3
                        className={`font-medium text-nurture-charcoal ${
                          task.completed
                            ? "line-through decoration-nurture-sage/50"
                            : ""
                        }`}
                      >
                        {task.title}
                      </h3>
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
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-nurture-blush/50 text-xs font-semibold text-nurture-charcoal">
                          {getInitials(task.assignee)}
                        </span>
                        <span className="text-sm text-nurture-charcoal/80">
                          {task.assignee}
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
        }}
        onSubmit={handleCreateOrUpdate}
        initial={editing}
        defaultAssignee={userEmail?.split("@")[0] ?? ""}
      />
    </div>
  );
};

export default TaskBoard;
