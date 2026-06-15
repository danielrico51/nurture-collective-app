import { describe, expect, it } from "vitest";
import {
  extractGoogleApiErrorMessage,
  formatClassCalendarSyncError,
} from "@/lib/events/calendar/errors";

describe("formatClassCalendarSyncError", () => {
  it("extracts nested Google API messages", () => {
    expect(
      extractGoogleApiErrorMessage({
        response: {
          data: {
            error: { message: "You need to have writer access to this calendar." },
          },
        },
      })
    ).toBe("You need to have writer access to this calendar.");
  });

  it("adds sharing guidance for permission errors", () => {
    const message = formatClassCalendarSyncError(
      new Error("You need to have writer access to this calendar.")
    );
    expect(message).toContain("admin@nesting-place.com");
    expect(message).toContain("Make changes to events");
  });
});
