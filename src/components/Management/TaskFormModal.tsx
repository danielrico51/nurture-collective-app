"use client";

import type { CreateTaskInput, ManagementTask } from "@/types/task";
import type { TeamMember } from "@/types/teamMember";
import { FormEvent, useEffect, useState } from "react";

interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreateTaskInput) => Promise<void>;
  initial?: ManagementTask | null;
  members: TeamMember[];
  membersLoading?: boolean;
  defaultAssignee?: string;
}

const TaskFormModal = ({
  open,
  onClose,
  onSubmit,
  initial,
  members,
  membersLoading = false,
  defaultAssignee = "",
}: TaskFormModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState(defaultAssignee);
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? "");
    setDescription(initial?.description ?? "");
    setAssignee(initial?.assignee ?? defaultAssignee);
    setDueDate(initial?.dueDate ?? "");
  }, [open, initial, defaultAssignee]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        title,
        description,
        assignee,
        dueDate: dueDate || null,
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
      <div className="relative w-full max-w-lg rounded-2xl border border-nurture-sage/20 bg-white p-6 shadow-2xl sm:rounded-3xl sm:p-8">
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
            <div>
              <label className="block text-sm font-medium">Responsible</label>
              <select
                required
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                disabled={membersLoading || members.length === 0}
                className="mt-1.5 w-full rounded-xl border border-nurture-sage/30 bg-white px-4 py-2.5 text-sm focus:border-nurture-sage focus:outline-none focus:ring-2 focus:ring-nurture-sage/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">
                  {membersLoading
                    ? "Loading team…"
                    : members.length === 0
                      ? "No team members found"
                      : "Select a team member"}
                </option>
                {members.map((member) => (
                  <option key={member.id} value={member.label}>
                    {member.label}
                    {member.email && member.email !== member.label
                      ? ` (${member.email})`
                      : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Deadline</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-nurture-sage/30 px-4 py-2.5 text-sm focus:border-nurture-sage focus:outline-none focus:ring-2 focus:ring-nurture-sage/30"
              />
            </div>
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
              disabled={saving || members.length === 0}
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
