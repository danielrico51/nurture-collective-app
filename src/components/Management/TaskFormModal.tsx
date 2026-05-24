"use client";

import type { CreateTaskInput, ManagementTask } from "@/types/task";
import type { TeamMember } from "@/types/teamMember";
import { FormEvent, useEffect, useState } from "react";
import UrgentFlag from "./UrgentFlag";

interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreateTaskInput) => Promise<void>;
  initial?: ManagementTask | null;
  members: TeamMember[];
  membersLoading?: boolean;
  defaultAssignees?: string[];
}

const TaskFormModal = ({
  open,
  onClose,
  onSubmit,
  initial,
  members,
  membersLoading = false,
  defaultAssignees = [],
}: TaskFormModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignees, setAssignees] = useState<string[]>(defaultAssignees);
  const [dueDate, setDueDate] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? "");
    setDescription(initial?.description ?? "");
    setAssignees(
      initial?.assignees?.length
        ? initial.assignees
        : defaultAssignees.length
          ? defaultAssignees
          : []
    );
    setDueDate(initial?.dueDate ?? "");
    setUrgent(initial?.urgent ?? false);
  }, [open, initial, defaultAssignees]);

  if (!open) return null;

  const toggleAssignee = (label: string) => {
    setAssignees((current) =>
      current.includes(label)
        ? current.filter((name) => name !== label)
        : [...current, label]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        title,
        description,
        assignees,
        dueDate: dueDate || null,
        urgent,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-nurture-charcoal/40 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-nurture-sage/20 bg-white p-6 shadow-2xl sm:rounded-3xl sm:p-8">
        <h3 className="font-serif text-2xl font-semibold text-nurture-charcoal">
          {initial ? "Edit task" : "New task"}
        </h3>
        <p className="mt-1 text-sm text-nurture-charcoal/60">
          Visible to everyone on the management team.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium">Task</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-nurture-sage/30 px-4 py-2.5 text-sm focus:border-nurture-sage focus:outline-none focus:ring-2 focus:ring-nurture-sage/30"
              placeholder="e.g. Review intake for Smith family"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Details</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1.5 w-full resize-none rounded-xl border border-nurture-sage/30 px-4 py-2.5 text-sm focus:border-nurture-sage focus:outline-none focus:ring-2 focus:ring-nurture-sage/30"
              placeholder="Notes, links, or context…"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium">
                Responsible
                {assignees.length > 0 ? (
                  <span className="ml-2 font-normal text-nurture-charcoal/50">
                    ({assignees.length} selected)
                  </span>
                ) : null}
              </label>
              <div
                className="mt-1.5 max-h-44 space-y-1 overflow-y-auto rounded-xl border border-nurture-sage/30 p-2"
                aria-busy={membersLoading}
              >
                {membersLoading ? (
                  <p className="px-3 py-2 text-sm text-nurture-charcoal/50">
                    Loading team…
                  </p>
                ) : members.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-nurture-charcoal/50">
                    No team members found
                  </p>
                ) : (
                  members.map((member) => {
                    const checked = assignees.includes(member.label);
                    return (
                      <label
                        key={member.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition hover:bg-nurture-cream ${
                          checked ? "bg-nurture-sage/10" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAssignee(member.label)}
                          className="h-4 w-4 rounded border-nurture-sage/40 text-nurture-sage focus:ring-nurture-sage/30"
                        />
                        <span className="min-w-0 flex-1 text-nurture-charcoal">
                          {member.label}
                          {member.email && member.email !== member.label ? (
                            <span className="block truncate text-xs text-nurture-charcoal/50">
                              {member.email}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium">Deadline</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-nurture-sage/30 px-4 py-2.5 text-sm focus:border-nurture-sage focus:outline-none focus:ring-2 focus:ring-nurture-sage/30"
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-nurture-sage/30 px-4 py-3">
            <div className="flex items-center gap-3">
              <UrgentFlag active={urgent} className="h-5 w-5" />
              <div>
                <p className="text-sm font-medium text-nurture-charcoal">
                  Mark as urgent
                </p>
                <p className="text-xs text-nurture-charcoal/55">
                  Shows a red flag on the task board
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={urgent}
              onClick={() => setUrgent((current) => !current)}
              className={`relative h-7 w-12 rounded-full transition ${
                urgent ? "bg-red-500" : "bg-nurture-charcoal/20"
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                  urgent ? "left-5" : "left-0.5"
                }`}
              />
            </button>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-5 py-2.5 text-sm font-medium text-nurture-charcoal/70 hover:bg-nurture-cream"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                saving || members.length === 0 || assignees.length === 0
              }
              className="rounded-full bg-nurture-sage px-6 py-2.5 text-sm font-medium text-white hover:bg-nurture-sage-dark disabled:opacity-60"
            >
              {saving ? "Saving…" : initial ? "Save changes" : "Add task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskFormModal;
