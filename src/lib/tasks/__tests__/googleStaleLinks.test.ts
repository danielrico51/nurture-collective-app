import { describe, expect, it } from "vitest";
import {
  clearGoogleTaskLinksInTasks,
  findStaleGoogleTaskLinks,
} from "@/lib/tasks/googleSync";
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

describe("clearGoogleTaskLinksInTasks", () => {
  it("clears per-user Google links used by personal sync", () => {
    const tasks = [
      sampleTask({
        id: "mine",
        assignees: ["Daniel"],
        googleTaskIdsByUser: { "admin@nesting-place.com": "deleted-google-id" },
      }),
      sampleTask({
        id: "other",
        assignees: ["Bob"],
        googleTaskIdsByUser: { "bob@nesting-place.com": "bob-google-id" },
      }),
    ];

    const { cleared, next } = clearGoogleTaskLinksInTasks(
      tasks,
      "admin@nesting-place.com"
    );

    expect(cleared).toBe(1);
    expect(next[0].googleTaskIdsByUser).toEqual({});
    expect(next[1].googleTaskIdsByUser).toEqual({
      "bob@nesting-place.com": "bob-google-id",
    });
  });
});
