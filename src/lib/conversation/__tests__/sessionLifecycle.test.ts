import { describe, expect, it } from "vitest";
import {
  isConversationProfileIncomplete,
  reactivateConversationIfIncomplete,
} from "@/lib/conversation/sessionLifecycle";
import type { ConversationSession } from "@/types/conversation";
import { createEmptyExtractedProfile } from "@/types/conversation";

const baseSession = (
  overrides: Partial<ConversationSession> = {}
): ConversationSession => ({
  id: "session-1",
  userId: "user-1",
  status: "completed",
  messages: [],
  extractedProfile: createEmptyExtractedProfile({
    maternalStage: "pregnant",
    supportInterests: ["birth-doula"],
    challenges: ["anxiety"],
  }),
  quickReplies: [],
  safetyEscalation: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("sessionLifecycle", () => {
  it("detects incomplete profiles missing name or contact", () => {
    expect(isConversationProfileIncomplete(baseSession())).toBe(true);
    expect(
      isConversationProfileIncomplete(
        baseSession({
          extractedProfile: createEmptyExtractedProfile({
            maternalStage: "pregnant",
            supportInterests: ["birth-doula"],
            challenges: ["anxiety"],
            name: "Alex",
            email: "alex@example.com",
          }),
        })
      )
    ).toBe(false);
  });

  it("does not reactivate completed sessions with a full profile", async () => {
    const session = baseSession({
      status: "completed",
      extractedProfile: createEmptyExtractedProfile({
        maternalStage: "pregnant",
        supportInterests: ["birth-doula"],
        challenges: ["anxiety"],
        name: "Alex",
        email: "alex@example.com",
      }),
    });
    const result = await reactivateConversationIfIncomplete(session);
    expect(result.status).toBe("completed");
  });
});
