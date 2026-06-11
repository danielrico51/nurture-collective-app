import { describe, expect, it } from "vitest";
import {
  buildSchedulingAuthErrorMessage,
  CALENDAR_OWNER_EMAIL,
  classifyGoogleAuthFailure,
  resolveCalendarDelegatedUser,
  validateAdcJsonForDelegatedDeploy,
  validateCalendarDelegatedUserForDeploy,
} from "@/lib/scheduling/calendarDeployGuards";

describe("resolveCalendarDelegatedUser", () => {
  it("defaults to admin@", () => {
    expect(resolveCalendarDelegatedUser({})).toBe(CALENDAR_OWNER_EMAIL);
  });

  it("rejects info@ alias in favor of admin@", () => {
    expect(
      resolveCalendarDelegatedUser({
        calendarDelegatedUser: "info@nesting-place.com",
      })
    ).toBe(CALENDAR_OWNER_EMAIL);
  });

  it("prefers calendar env over tasks env", () => {
    expect(
      resolveCalendarDelegatedUser({
        calendarDelegatedUser: "admin@nesting-place.com",
        tasksDelegatedUser: "other@nesting-place.com",
      })
    ).toBe("admin@nesting-place.com");
  });
});

describe("validateCalendarDelegatedUserForDeploy", () => {
  it("blocks info@ for deploy", () => {
    expect(validateCalendarDelegatedUserForDeploy("info@nesting-place.com")).toEqual({
      ok: false,
      reason: expect.stringContaining("public alias"),
    });
  });

  it("accepts admin@", () => {
    expect(validateCalendarDelegatedUserForDeploy("admin@nesting-place.com")).toEqual({
      ok: true,
      email: "admin@nesting-place.com",
    });
  });
});

describe("validateAdcJsonForDelegatedDeploy", () => {
  it("accepts authorized_user ADC with refresh token", () => {
    const result = validateAdcJsonForDelegatedDeploy(
      JSON.stringify({
        type: "authorized_user",
        client_id: "abc.apps.googleusercontent.com",
        refresh_token: "rt",
      })
    );
    expect(result.ok).toBe(true);
  });

  it("rejects authorized_user ADC without refresh token", () => {
    const result = validateAdcJsonForDelegatedDeploy(
      JSON.stringify({
        type: "authorized_user",
        client_id: "abc.apps.googleusercontent.com",
      })
    );
    expect(result).toEqual({
      ok: false,
      reason: expect.stringContaining("refresh_token"),
    });
  });

  it("rejects invalid JSON", () => {
    expect(validateAdcJsonForDelegatedDeploy("not-json")).toEqual({
      ok: false,
      reason: "ADC file is not valid JSON.",
    });
  });
});

describe("classifyGoogleAuthFailure", () => {
  it("detects expired ADC", () => {
    expect(
      classifyGoogleAuthFailure('{"error":"invalid_grant","error_subtype":"invalid_rapt"}').kind
    ).toBe("expired_adc");
  });

  it("detects workspace delegation issues", () => {
    expect(
      classifyGoogleAuthFailure("unauthorized to retrieve access tokens for this client").kind
    ).toBe("workspace_delegation");
  });
});

describe("buildSchedulingAuthErrorMessage", () => {
  it("mentions ADC refresh for invalid_rapt", () => {
    const message = buildSchedulingAuthErrorMessage(
      CALENDAR_OWNER_EMAIL,
      "invalid_grant invalid_rapt"
    );
    expect(message).toContain("expired or need re-auth");
    expect(message).toContain("gcloud auth application-default login");
  });
});
