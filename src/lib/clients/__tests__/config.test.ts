import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clientsCrmStorageConfig,
  describeClientsCrmStorageScope,
  getClientsCrmStorageScope,
  getClientsStorageMode,
  resolveClientsCrmPrefix,
} from "@/lib/clients/config";

describe("resolveClientsCrmPrefix", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses legacy prod root on main deployments", () => {
    expect(
      resolveClientsCrmPrefix({ AMPLIFY_BRANCH: "main", NODE_ENV: "production" })
    ).toBe("crm/");
  });

  it("scopes dev branch data under crm/dev/", () => {
    expect(
      resolveClientsCrmPrefix({ AMPLIFY_BRANCH: "dev", NODE_ENV: "production" })
    ).toBe("crm/dev/");
  });

  it("scopes local developer machines under crm/local/", () => {
    expect(resolveClientsCrmPrefix({ NODE_ENV: "development" })).toBe("crm/local/");
  });

  it("honors an explicit CLIENTS_CRM_S3_PREFIX override", () => {
    expect(
      resolveClientsCrmPrefix({
        CLIENTS_CRM_S3_PREFIX: "crm/staging/",
        AMPLIFY_BRANCH: "main",
      })
    ).toBe("crm/staging/");
  });
});

describe("getClientsStorageMode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to local when no bucket is configured in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NURTURE_CLIENTS_BUCKET", "");
    expect(getClientsStorageMode()).toBe("local");
  });

  it("uses S3 when bucket is configured in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NURTURE_CLIENTS_BUCKET", "nurture-clients-dev-123");
    expect(getClientsStorageMode()).toBe("s3");
  });
});

describe("clientsCrmStorageConfig", () => {
  it("exposes deploymentEnvironment on the config object", () => {
    expect(clientsCrmStorageConfig.deploymentEnvironment).toBeTruthy();
    expect(clientsCrmStorageConfig.s3Prefix.endsWith("/")).toBe(true);
  });
});

describe("getClientsCrmStorageScope", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the active deployment scope for API responses", () => {
    vi.stubEnv("AMPLIFY_BRANCH", "dev");
    vi.stubEnv("NODE_ENV", "production");
    expect(getClientsCrmStorageScope()).toEqual({
      deploymentEnvironment: "dev",
      scope: "crm/dev/",
    });
  });

  it("describes non-prod scopes as isolated from prod", () => {
    expect(
      describeClientsCrmStorageScope({
        deploymentEnvironment: "dev",
        scope: "crm/dev/",
      })
    ).toContain("do not affect prod");
  });
});
