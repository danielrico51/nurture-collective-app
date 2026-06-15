import { describe, expect, it } from "vitest";
import {
  appendRegistrationSourceToPath,
  resolveRegistrationSourceFromSearchParams,
} from "@/lib/classRegistrations/attribution";

describe("class registration attribution", () => {
  it("detects google business source from source param", () => {
    expect(
      resolveRegistrationSourceFromSearchParams(
        new URLSearchParams("source=google_business")
      )
    ).toBe("google_business");
  });

  it("detects google business source from utm_source param", () => {
    expect(
      resolveRegistrationSourceFromSearchParams(
        new URLSearchParams("utm_source=google_business")
      )
    ).toBe("google_business");
  });

  it("returns null for unrelated traffic", () => {
    expect(
      resolveRegistrationSourceFromSearchParams(
        new URLSearchParams("utm_source=newsletter")
      )
    ).toBeNull();
  });

  it("appends source to register paths", () => {
    expect(
      appendRegistrationSourceToPath(
        "/events-and-classes/childbirth-101/register"
      )
    ).toBe("/events-and-classes/childbirth-101/register?source=google_business");
  });
});
