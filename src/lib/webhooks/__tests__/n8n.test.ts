import { afterEach, describe, expect, it, vi } from "vitest";

describe("buildN8nPayload", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("adds team notification email fields to object payloads", async () => {
    vi.stubEnv("N8N_TEAM_NOTIFICATION_EMAIL", "info@nesting-place.com");
    const { buildN8nPayload } = await import("@/lib/webhooks/n8n");

    const payload = buildN8nPayload({
      source: "website",
      first_name: "Alex",
    });

    expect(payload).toMatchObject({
      source: "website",
      first_name: "Alex",
      team_notification_email: "info@nesting-place.com",
      send_to: "info@nesting-place.com",
      notification_email: "info@nesting-place.com",
    });
  });

  it("wraps non-object payloads", async () => {
    vi.stubEnv("N8N_TEAM_NOTIFICATION_EMAIL", "info@nesting-place.com");
    const { buildN8nPayload } = await import("@/lib/webhooks/n8n");

    const payload = buildN8nPayload("legacy");

    expect(payload.data).toBe("legacy");
    expect(payload.send_to).toBe("info@nesting-place.com");
  });
});
