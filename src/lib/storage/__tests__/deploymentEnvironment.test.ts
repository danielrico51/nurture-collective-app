import { describe, expect, it } from "vitest";
import { resolveDeploymentEnvironment } from "@/lib/storage/deploymentEnvironment";

describe("resolveDeploymentEnvironment", () => {
  it("treats main branch as prod", () => {
    expect(
      resolveDeploymentEnvironment({ AMPLIFY_BRANCH: "main", NODE_ENV: "production" })
    ).toBe("prod");
  });

  it("treats non-main deployed branches as dev", () => {
    expect(
      resolveDeploymentEnvironment({ AMPLIFY_BRANCH: "dev", NODE_ENV: "production" })
    ).toBe("dev");
  });

  it("honors explicit APP_ENV overrides", () => {
    expect(resolveDeploymentEnvironment({ APP_ENV: "dev", AMPLIFY_BRANCH: "main" })).toBe(
      "dev"
    );
    expect(resolveDeploymentEnvironment({ APP_ENV: "prod", AMPLIFY_BRANCH: "dev" })).toBe(
      "prod"
    );
    expect(resolveDeploymentEnvironment({ APP_ENV: "local" })).toBe("local");
  });

  it("defaults deployed builds to prod only when branch and APP_ENV are unknown", () => {
    expect(resolveDeploymentEnvironment({ NODE_ENV: "production" })).toBe("prod");
    expect(
      resolveDeploymentEnvironment({ APP_ENV: "dev", NODE_ENV: "production" })
    ).toBe("dev");
  });
});
