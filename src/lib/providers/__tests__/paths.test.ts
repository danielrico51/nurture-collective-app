import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildProviderKey,
  buildProvidersRootPrefix,
  parseProviderIdFromKey,
} from "@/lib/providers/paths";

describe("provider CRM paths", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("stores providers under the deployment-scoped CRM root on dev", () => {
    vi.stubEnv("AMPLIFY_BRANCH", "dev");
    vi.stubEnv("NODE_ENV", "production");
    expect(buildProvidersRootPrefix()).toBe("crm/dev/providers/");
    expect(buildProviderKey("abc-123")).toBe(
      "crm/dev/providers/provider_id=abc-123/provider.json"
    );
  });

  it("keeps the legacy prod root on main", () => {
    vi.stubEnv("AMPLIFY_BRANCH", "main");
    vi.stubEnv("NODE_ENV", "production");
    expect(buildProvidersRootPrefix()).toBe("crm/providers/");
  });

  it("parses provider ids from scoped keys", () => {
    expect(
      parseProviderIdFromKey(
        "crm/dev/providers/provider_id=jane-doe/provider.json"
      )
    ).toBe("jane-doe");
  });
});
