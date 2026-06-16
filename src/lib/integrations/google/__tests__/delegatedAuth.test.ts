import { afterEach, describe, expect, it, vi } from "vitest";
import { shouldUseGoogleWorkloadIdentity } from "@/lib/integrations/google/delegatedAuth";

describe("shouldUseGoogleWorkloadIdentity", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns true when WIF env is complete", () => {
    vi.stubEnv("GOOGLE_WORKLOAD_IDENTITY_PROJECT_NUMBER", "643818957131");
    vi.stubEnv("GOOGLE_WORKLOAD_IDENTITY_POOL_ID", "nurture-amplify-aws");
    vi.stubEnv("GOOGLE_WORKLOAD_IDENTITY_PROVIDER_ID", "aws-amplify");

    expect(shouldUseGoogleWorkloadIdentity()).toBe(true);
  });

  it("returns false when forceAdc is set (deploy script ADC gate)", () => {
    vi.stubEnv("GOOGLE_WORKLOAD_IDENTITY_PROJECT_NUMBER", "643818957131");
    vi.stubEnv("GOOGLE_WORKLOAD_IDENTITY_POOL_ID", "nurture-amplify-aws");
    vi.stubEnv("GOOGLE_WORKLOAD_IDENTITY_PROVIDER_ID", "aws-amplify");

    expect(shouldUseGoogleWorkloadIdentity(true)).toBe(false);
  });

  it("returns false when WIF env is incomplete", () => {
    vi.stubEnv("GOOGLE_WORKLOAD_IDENTITY_PROJECT_NUMBER", "");
    vi.stubEnv("GOOGLE_WORKLOAD_IDENTITY_POOL_ID", "");
    vi.stubEnv("GOOGLE_WORKLOAD_IDENTITY_PROVIDER_ID", "");

    expect(shouldUseGoogleWorkloadIdentity()).toBe(false);
  });
});
