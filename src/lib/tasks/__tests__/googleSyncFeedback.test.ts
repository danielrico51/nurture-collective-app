import { describe, expect, it } from "vitest";
import {
  describePullSyncResult,
  describePushSyncResult,
  describeRecreateSyncResult,
  formatGoogleTasksError,
  getGooglePushEligibility,
  googleTasksDestinationHint,
  isGoogleTasksErrorMessage,
} from "@/lib/tasks/googleSyncFeedback";
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

describe("googleSyncFeedback", () => {
  it("detects Google API error messages", () => {
    expect(isGoogleTasksErrorMessage("Request failed with status code 403")).toBe(
      true
    );
    expect(isGoogleTasksErrorMessage("Domain-wide delegation is not configured")).toBe(
      true
    );
    expect(isGoogleTasksErrorMessage("S3 bucket missing")).toBe(false);
  });

  it("formats Google errors without masking delegation guidance", () => {
    const message = "Domain-wide delegation failed for admin@nesting-place.com";
    expect(formatGoogleTasksError(new Error(message))).toBe(message);
    expect(formatGoogleTasksError(new Error("invalid_grant"))).toContain(
      "Connect Google Tasks again"
    );
  });

  it("counts push eligibility by category and link state", () => {
    const counts = getGooglePushEligibility([
      sampleTask({ assignees: ["Alison"] }),
      sampleTask({ id: "task-2", assignees: ["Alison"], googleTaskId: "g-1" }),
      sampleTask({ id: "task-3", category: "client" }),
      sampleTask({ id: "task-4", assignees: ["Bob"] }),
    ]);
    expect(counts).toEqual({ eligible: 2, alreadyLinked: 1, clientTasks: 1 });
  });

  it("limits eligibility to tasks assigned to the current user", () => {
    const counts = getGooglePushEligibility(
      [
        sampleTask({ id: "mine", assignees: ["Alison"] }),
        sampleTask({ id: "theirs", assignees: ["Bob"], googleTaskId: "g-1" }),
      ],
      ["alison"]
    );
    expect(counts).toEqual({ eligible: 1, alreadyLinked: 0, clientTasks: 0 });
  });

  it("excludes completed tasks from push eligibility", () => {
    const counts = getGooglePushEligibility(
      [
        sampleTask({ id: "open", assignees: ["Alison"] }),
        sampleTask({
          id: "done",
          assignees: ["Alison"],
          completed: true,
          googleTaskId: "g-done",
        }),
      ],
      ["alison"]
    );
    expect(counts).toEqual({ eligible: 1, alreadyLinked: 0, clientTasks: 0 });
  });

  it("describes push results with actionable copy", () => {
    const eligibility = { eligible: 2, alreadyLinked: 0, clientTasks: 1 };
    expect(describePushSyncResult({ migrated: 1, skipped: 0, errors: [] }, eligibility)).toEqual({
      tone: "success",
      message: "Pushed 1 assigned task to Google Tasks.",
    });
    expect(
      describePushSyncResult({ migrated: 0, skipped: 0, errors: [] }, eligibility)
    ).toMatchObject({ tone: "info" });
    expect(
      describePushSyncResult(
        { migrated: 0, skipped: 0, errors: [], linksCleared: 85 },
        { eligible: 0, alreadyLinked: 85, clientTasks: 0 }
      ).message
    ).toContain("Cleared 85 stale");
    expect(
      describePushSyncResult(
        { migrated: 0, skipped: 0, errors: ["boom"] },
        eligibility
      ).tone
    ).toBe("error");
  });

  it("explains empty recreate results", () => {
    const feedback = describeRecreateSyncResult({
      migrated: 0,
      skipped: 5,
      errors: [],
      linksCleared: 0,
      listReset: true,
      eligibility: { eligible: 0, alreadyLinked: 0, clientTasks: 1 },
    });
    expect(feedback.tone).toBe("info");
    expect(feedback.message).toContain("Nothing to re-create");
    expect(feedback.message).toContain("assigned internal tasks");
  });

  it("describes pull results", () => {
    expect(describePullSyncResult({ pulled: 2, linked: 1, skipped: 0 }).tone).toBe(
      "success"
    );
    expect(describePullSyncResult({ pulled: 0, linked: 0, skipped: 3 }).message).toContain(
      "skipped"
    );
  });

  it("builds destination hints for delegated and personal sync", () => {
    expect(
      googleTasksDestinationHint({
        personalSync: false,
        delegatedUser: "admin@nesting-place.com",
        taskListTitle: "Nesting Place Tasks",
      })
    ).toContain("admin@nesting-place.com");
    expect(
      googleTasksDestinationHint({
        personalSync: true,
        connected: false,
      })
    ).toContain("Connect Google Tasks");
  });
});
