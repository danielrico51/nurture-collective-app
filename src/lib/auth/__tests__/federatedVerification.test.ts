import { describe, expect, it } from "vitest";
import { buildFederatedVerificationAttributes } from "@/lib/auth/federatedVerification";
import { FEDERATED_PLACEHOLDER_PHONE } from "@/utils/signUpAttributes";

describe("buildFederatedVerificationAttributes", () => {
  it("marks Google email verified when present", () => {
    expect(
      buildFederatedVerificationAttributes(
        {},
        { email: "jane@example.com", email_verified: "false" }
      )
    ).toEqual({ email_verified: "true" });
  });

  it("marks real phone verified and skips placeholders", () => {
    expect(
      buildFederatedVerificationAttributes(
        { phone_number: "+12065550100" },
        { phone_number_verified: "false" }
      )
    ).toEqual({ phone_number_verified: "true" });

    expect(
      buildFederatedVerificationAttributes(
        { phone_number: FEDERATED_PLACEHOLDER_PHONE },
        { phone_number_verified: "false" }
      )
    ).toEqual({});
  });
});
