import { describe, expect, it } from "vitest";
import { findStaleGoogleTaskLinks } from "@/lib/tasks/googleSync";
import type { ManagementTask } from "@/types/task";

const sampleTask = (overrides: Partial<ManagementTask> = {}): ManagementTask => ({
  id: "task-1",
  title: "Test",
  description: "",
  assignees: [],
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

describe("findStaleGoogleTaskLinks", () => {
  it("clears links that are missing from the current Google list", () => {
    const tasks = [
      sampleTask({ id: "a", googleTaskId: "gone-1" }),
      sampleTask({ id: "b", googleTaskId: "still-there" }),
      sampleTask({ id: "c", category: "client", googleTaskId: "gone-2" }),
    ];
    const { cleared, next } = findStaleGoogleTaskLinks(
      tasks,
      new Set(["still-there"])
    );

    expect(cleared).toBe(1);
    expect(next[0].googleTaskId).toBeNull();
    expect(next[1].googleTaskId).toBe("still-there");
    expect(next[2].googleTaskId).toBe("gone-2");
  });
});
