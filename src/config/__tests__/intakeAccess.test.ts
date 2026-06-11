import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isPublicIntakeEnabled,
  PUBLIC_INTAKE_PATH,
  resolveIntakePath,
} from "@/config/intakeAccess";
import {
  buildIntakeHref,
  buildPublicIntakeHref,
} from "@/config/carePaths";

describe("isPublicIntakeEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to public intake when env is unset", () => {
    expect(isPublicIntakeEnabled()).toBe(true);
    expect(resolveIntakePath()).toBe(PUBLIC_INTAKE_PATH);
    expect(buildIntakeHref()).toBe("/intake");
  });

  it("honors explicit false to require sign-in", () => {
    vi.stubEnv("NEXT_PUBLIC_INTAKE_PUBLIC", "false");
    expect(isPublicIntakeEnabled()).toBe(false);
    expect(resolveIntakePath()).toBe("/apps/dashboard/intake");
    expect(buildIntakeHref()).toBe("/apps/dashboard/intake");
  });

  it("keeps marketing guest links on the public intake route", () => {
    vi.stubEnv("NEXT_PUBLIC_INTAKE_PUBLIC", "false");
    expect(buildPublicIntakeHref()).toBe("/intake");
    expect(buildPublicIntakeHref("birth-doula")).toBe(
      "/intake?service=birth-doula"
    );
  });
});
