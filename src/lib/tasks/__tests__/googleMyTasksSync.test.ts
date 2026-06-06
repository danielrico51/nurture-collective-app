import { describe, expect, it } from "vitest";
import {
  shouldPushTaskToGoogleForUser,
  shouldSyncTaskToGoogleForUser,
} from "@/lib/tasks/utils";
import type { ManagementTask } from "@/types/task";

const sampleTask = (overrides: Partial<ManagementTask> = {}): ManagementTask => ({
  id: "task-1",
  title: "Test",
  description: "",
  assignees: ["Alison"],
  dueDate: null,
  urgent: false,
  completed: false,
  completedAt: null,
  createdAt: "2026-06-01T12:00:00.000Z",
  updatedAt: "2026-06-01T12:00:00.000Z",
  createdBy: "admin@nesting-place.com",
  category: "internal",
  clickUpTaskId: null,
  googleTaskId: null,
  googleTaskIdsByUser: {},
  clientEmail: null,
  ...overrides,
});

describe("shouldSyncTaskToGoogleForUser", () => {
  it("syncs internal tasks assigned to the user", () => {
    expect(
      shouldSyncTaskToGoogleForUser(sampleTask(), ["alison", "alison@nesting-place.com"])
    ).toBe(true);
  });

  it("skips completed tasks for push", () => {
    expect(
      shouldPushTaskToGoogleForUser(
        sampleTask({ completed: true }),
        ["alison"]
      )
    ).toBe(false);
    expect(
      shouldSyncTaskToGoogleForUser(
        sampleTask({ completed: true }),
        ["alison"]
      )
    ).toBe(true);
  });

  it("skips client tasks and tasks assigned to someone else", () => {
    expect(
      shouldSyncTaskToGoogleForUser(
        sampleTask({ category: "client" }),
        ["alison"]
      )
    ).toBe(false);
    expect(
      shouldSyncTaskToGoogleForUser(
        sampleTask({ assignees: ["Bob"] }),
        ["alison"]
      )
    ).toBe(false);
  });
});
