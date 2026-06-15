import { describe, expect, it } from "vitest";
import { resolveEventsS3Key } from "@/lib/events/config";

describe("resolveEventsS3Key", () => {
  it("keeps the legacy prod path on main", () => {
    expect(
      resolveEventsS3Key({
        AMPLIFY_BRANCH: "main",
        NODE_ENV: "production",
      })
    ).toBe("management/events/items.json");
  });

  it("isolates dev branch events under a dev prefix", () => {
    expect(
      resolveEventsS3Key({
        AMPLIFY_BRANCH: "dev",
        NODE_ENV: "production",
      })
    ).toBe("management/events/dev/items.json");
  });

  it("isolates local development under a local prefix when using S3", () => {
    expect(resolveEventsS3Key({ NODE_ENV: "development" })).toBe(
      "management/events/local/items.json"
    );
  });

  it("respects an explicit EVENTS_S3_KEY override", () => {
    expect(
      resolveEventsS3Key({
        AMPLIFY_BRANCH: "dev",
        EVENTS_S3_KEY: "management/events/staging/items.json",
      })
    ).toBe("management/events/staging/items.json");
  });
});
