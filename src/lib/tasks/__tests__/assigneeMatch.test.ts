import { describe, expect, it } from "vitest";
import {
  findTeamMemberForUser,
  getUserAssigneeMatchers,
  taskAssignedToUser,
} from "@/lib/tasks/utils";
import type { ManagementTask } from "@/types/task";
import type { TeamMember } from "@/types/teamMember";

const alexMember: TeamMember = {
  id: "sub-alex",
  label: "Alex Burleigh",
  username: "alexburleigh",
  email: "alex.burleigh@nesting-place.com",
};

const sampleTask = (assignees: string[]): ManagementTask => ({
  id: "task-1",
  title: "Test",
  description: "",
  assignees,
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
});

describe("findTeamMemberForUser", () => {
  it("matches Cognito username sign-in to team member email", () => {
    expect(
      findTeamMemberForUser([alexMember], {
        email: "alex.burleigh@nesting-place.com",
        loginId: "alexburleigh",
      })
    ).toEqual(alexMember);
  });

  it("matches username-only session identity", () => {
    expect(
      findTeamMemberForUser([alexMember], { loginId: "alexburleigh" })
    ).toEqual(alexMember);
  });
});

describe("taskAssignedToUser for Alex Burleigh", () => {
  it("matches tasks assigned by email when user signs in with username", () => {
    const member = findTeamMemberForUser([alexMember], {
      email: "alex.burleigh@nesting-place.com",
      loginId: "alexburleigh",
    });
    const matchers = getUserAssigneeMatchers(
      "alex.burleigh@nesting-place.com",
      undefined,
      member,
      "alexburleigh"
    );

    expect(
      taskAssignedToUser(
        sampleTask(["alex.burleigh@nesting-place.com"]),
        matchers
      )
    ).toBe(true);
  });

  it("matches tasks assigned by display label for username sign-in", () => {
    const member = findTeamMemberForUser([alexMember], {
      loginId: "alexburleigh",
    });
    const matchers = getUserAssigneeMatchers(
      undefined,
      undefined,
      member,
      "alexburleigh"
    );

    expect(taskAssignedToUser(sampleTask(["Alex Burleigh"]), matchers)).toBe(
      true
    );
  });

  it("matches dotted email assignees from username-only legacy identity", () => {
    const matchers = getUserAssigneeMatchers("alexburleigh");

    expect(
      taskAssignedToUser(
        sampleTask(["alex.burleigh@nesting-place.com"]),
        matchers
      )
    ).toBe(true);
  });

  it("still needs member profile for display-name assignees with username sign-in", () => {
    const matchers = getUserAssigneeMatchers("alexburleigh");

    expect(taskAssignedToUser(sampleTask(["Alex Burleigh"]), matchers)).toBe(
      false
    );
  });
});
