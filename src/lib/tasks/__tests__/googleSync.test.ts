import { describe, expect, it } from "vitest";
import {
  applyGoogleTaskToManagement,
  buildGoogleTaskNotes,
  managementTaskToGoogleTask,
  parseAppTaskIdFromNotes,
  parseDescriptionFromNotes,
  shouldSyncTaskToGoogle,
} from "@/lib/tasks/googleSyncMapping";
import type { ManagementTask } from "@/types/task";

const sampleTask = (overrides: Partial<ManagementTask> = {}): ManagementTask => ({
  id: "task-123",
  title: "Follow up with mom",
  description: "Check in about overnight support.",
  assignees: ["Alison"],
  dueDate: "2026-06-10T12:00:00.000Z",
  urgent: true,
  completed: false,
  completedAt: null,
  createdAt: "2026-06-01T12:00:00.000Z",
  updatedAt: "2026-06-01T12:00:00.000Z",
  createdBy: "info@nesting-place.com",
  category: "internal",
  clickUpTaskId: null,
  googleTaskId: null,
  googleTaskIdsByUser: {},
  clientEmail: null,
  ...overrides,
});

describe("google task mapping", () => {
  it("syncs internal tasks only", () => {
    expect(shouldSyncTaskToGoogle(sampleTask())).toBe(true);
    expect(shouldSyncTaskToGoogle(sampleTask({ category: "client" }))).toBe(
      false
    );
  });

  it("embeds app id in notes for round-trip linking", () => {
    const notes = buildGoogleTaskNotes(sampleTask());
    expect(parseAppTaskIdFromNotes(notes)).toBe("task-123");
    expect(parseDescriptionFromNotes(notes)).toBe(
      "Check in about overnight support."
    );
  });

  it("maps urgent tasks to Google title prefix", () => {
    const payload = managementTaskToGoogleTask(sampleTask());
    expect(payload.title).toBe("[URGENT] Follow up with mom");
    expect(payload.status).toBe("needsAction");
  });

  it("applies newer Google updates to local tasks", () => {
    const current = sampleTask();
    const updated = applyGoogleTaskToManagement(
      {
        id: "google-1",
        title: "Updated title",
        notes: buildGoogleTaskNotes(current),
        status: "completed",
        updated: "2026-06-05T12:00:00.000Z",
      },
      current
    );
    expect(updated.title).toBe("Updated title");
    expect(updated.completed).toBe(true);
    expect(updated.googleTaskId).toBe("google-1");
  });
});
