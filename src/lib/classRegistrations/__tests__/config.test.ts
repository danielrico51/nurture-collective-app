import { describe, expect, it } from "vitest";
import { resolveClassRegistrationS3Prefix } from "@/lib/classRegistrations/config";

describe("resolveClassRegistrationS3Prefix", () => {
  it("keeps the legacy prod prefix on main", () => {
    expect(
      resolveClassRegistrationS3Prefix({
        AMPLIFY_BRANCH: "main",
        NODE_ENV: "production",
      })
    ).toBe("class-registrations/");
  });

  it("isolates dev branch registrations under a dev prefix", () => {
    expect(
      resolveClassRegistrationS3Prefix({
        AMPLIFY_BRANCH: "dev",
        NODE_ENV: "production",
      })
    ).toBe("class-registrations/dev/");
  });

  it("respects an explicit CLASS_REGISTRATIONS_S3_PREFIX override", () => {
    expect(
      resolveClassRegistrationS3Prefix({
        AMPLIFY_BRANCH: "dev",
        CLASS_REGISTRATIONS_S3_PREFIX: "class-registrations/staging",
      })
    ).toBe("class-registrations/staging/");
  });
});
