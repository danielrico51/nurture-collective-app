import { TASK_REPORT } from "@/config/taskReport";
import {
  formatAssignees,
  formatDueDate,
  getDueStatus,
} from "@/lib/tasks/utils";
import type { ManagementTask } from "@/types/task";

export const TASK_REPORT_COLUMNS = [
  "Task",
  "Details",
  "Responsible",
  "Deadline",
  "Due status",
  "Urgent",
  "Category",
  "Client email",
  "Created",
  "Last updated",
  "Created by",
] as const;

export type TaskReportColumn = (typeof TASK_REPORT_COLUMNS)[number];

export interface TaskReportRow {
  task: string;
  details: string;
  responsible: string;
  deadline: string;
  dueStatus: string;
  urgent: string;
  category: string;
  clientEmail: string;
  created: string;
  lastUpdated: string;
  createdBy: string;
}

export interface TaskReportPayload {
  generatedAt: string;
  scopeLabel: string;
  openCount: number;
  urgentCount: number;
  overdueCount: number;
  rows: TaskReportRow[];
}

const dueStatusLabel = (task: ManagementTask): string => {
  const status = getDueStatus(task.dueDate, task.completed);
  if (status === "overdue") return "Overdue";
  if (status === "soon") return "Due soon";
  if (status === "ok") return "On track";
  return "No deadline";
};

const formatTimestamp = (iso: string | null): string => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const taskToReportRow = (task: ManagementTask): TaskReportRow => ({
  task: task.title,
  details: task.description?.trim() || "—",
  responsible: formatAssignees(task.assignees),
  deadline: formatDueDate(task.dueDate),
  dueStatus: dueStatusLabel(task),
  urgent: task.urgent ? "Yes" : "No",
  category: task.category === "client" ? "Client" : "Internal",
  clientEmail: task.clientEmail?.trim() || "—",
  created: formatTimestamp(task.createdAt),
  lastUpdated: formatTimestamp(task.updatedAt),
  createdBy: task.createdBy?.trim() || "—",
});

export const buildOpenTaskReport = (
  tasks: ManagementTask[],
  scopeLabel: string
): TaskReportPayload => {
  const openTasks = tasks
    .filter((task) => !task.completed)
    .sort((a, b) => {
      const aDue = a.dueDate ?? "9999-12-31";
      const bDue = b.dueDate ?? "9999-12-31";
      if (aDue !== bDue) return aDue.localeCompare(bDue);
      return a.title.localeCompare(b.title);
    });

  return {
    generatedAt: new Date().toLocaleString(undefined, {
      dateStyle: "full",
      timeStyle: "short",
    }),
    scopeLabel,
    openCount: openTasks.length,
    urgentCount: openTasks.filter((task) => task.urgent).length,
    overdueCount: openTasks.filter(
      (task) => getDueStatus(task.dueDate, false) === "overdue"
    ).length,
    rows: openTasks.map(taskToReportRow),
  };
};

export const reportRowToValues = (row: TaskReportRow): string[] => [
  row.task,
  row.details,
  row.responsible,
  row.deadline,
  row.dueStatus,
  row.urgent,
  row.category,
  row.clientEmail,
  row.created,
  row.lastUpdated,
  row.createdBy,
];

export const buildReportFilenameStem = (scopeLabel: string): string => {
  const date = new Date().toISOString().slice(0, 10);
  const scope = scopeLabel.toLowerCase().replace(/\s+/g, "-");
  return `${TASK_REPORT.title.toLowerCase().replace(/\s+/g, "-")}-${scope}-${date}`;
};
