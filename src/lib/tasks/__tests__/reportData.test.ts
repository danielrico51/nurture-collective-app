import { describe, expect, it } from "vitest";
import { buildOpenTaskReport, taskToReportRow } from "@/lib/tasks/reportData";
import type { ManagementTask } from "@/types/task";

const sampleTask = (overrides: Partial<ManagementTask> = {}): ManagementTask => ({
  id: "task-1",
  title: "Review intake",
  description: "Follow up with family",
  assignees: ["Barb"],
  dueDate: "2026-06-01",
  urgent: true,
  completed: false,
  completedAt: null,
  createdAt: "2026-05-01T12:00:00.000Z",
  updatedAt: "2026-05-02T12:00:00.000Z",
  createdBy: "alison@example.com",
  category: "internal",
  clickUpTaskId: null,
  googleTaskId: null,
  googleTaskIdsByUser: {},
  clientEmail: null,
  ...overrides,
});

describe("buildOpenTaskReport", () => {
  it("includes only incomplete tasks", () => {
    const report = buildOpenTaskReport(
      [
        sampleTask(),
        sampleTask({ id: "task-2", title: "Done task", completed: true }),
      ],
      "All tasks"
    );

    expect(report.openCount).toBe(1);
    expect(report.rows).toHaveLength(1);
    expect(report.rows[0]?.task).toBe("Review intake");
  });

  it("maps task details into report rows", () => {
    const row = taskToReportRow(sampleTask({ category: "client", clientEmail: "mom@example.com" }));

    expect(row.responsible).toBe("Barb");
    expect(row.urgent).toBe("Yes");
    expect(row.category).toBe("Client");
    expect(row.clientEmail).toBe("mom@example.com");
  });
});
