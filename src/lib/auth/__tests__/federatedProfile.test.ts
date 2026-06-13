import { describe, expect, it } from "vitest";
import {
  needsFederatedProfileCompletion,
} from "@/lib/auth/federatedProfile";
import {
  FEDERATED_PLACEHOLDER_PHONE,
  isFederatedPlaceholderPhone,
  isValidCognitoPhoneNumber,
} from "@/utils/signUpAttributes";

describe("isValidCognitoPhoneNumber", () => {
  it("accepts valid US E.164 numbers", () => {
    expect(isValidCognitoPhoneNumber("+12065550100")).toBe(true);
    expect(isValidCognitoPhoneNumber("+12025550100")).toBe(true);
  });

  it("rejects invalid US numbers", () => {
    expect(isValidCognitoPhoneNumber("+10000000000")).toBe(false);
    expect(isValidCognitoPhoneNumber("+10626139986")).toBe(false);
  });
});

describe("isFederatedPlaceholderPhone", () => {
  it("flags Google sub mapped as phone_number", () => {
    expect(isFederatedPlaceholderPhone("117369829384756728901")).toBe(true);
  });

  it("flags legacy and current placeholders", () => {
    expect(isFederatedPlaceholderPhone(FEDERATED_PLACEHOLDER_PHONE)).toBe(true);
    expect(isFederatedPlaceholderPhone("+10000000000")).toBe(true);
  });
});

describe("needsFederatedProfileCompletion", () => {
  const complete = {
    phone_number: "+12065550100",
    address: "123 Main St, Ridgewood, NJ",
    "custom:username": "janedoe",
  };

  it("returns false when profile fields are complete", () => {
    expect(needsFederatedProfileCompletion(complete)).toBe(false);
  });

  it("returns false for a completed Google-linked member profile", () => {
    expect(
      needsFederatedProfileCompletion({
        email: "operations@nesting-place.com",
        phone_number: "+12018928961",
        address: "215 Country Route 1",
        "custom:username": "santi_campo",
      })
    ).toBe(false);
  });

  it("flags placeholder phone and address from federated PreSignUp", () => {
    expect(
      needsFederatedProfileCompletion({
        ...complete,
        phone_number: FEDERATED_PLACEHOLDER_PHONE,
      })
    ).toBe(true);
    expect(
      needsFederatedProfileCompletion({
        ...complete,
        phone_number: "+10000000000",
      })
    ).toBe(true);
    expect(
      needsFederatedProfileCompletion({
        ...complete,
        phone_number: "117369829384756728901",
      })
    ).toBe(true);
  });

  it("flags email used as placeholder address from Cognito IdP mapping", () => {
    expect(
      needsFederatedProfileCompletion({
        ...complete,
        email: "jane@example.com",
        address: "jane@example.com",
      })
    ).toBe(true);
  });

  it("flags missing or invalid username", () => {
    expect(
      needsFederatedProfileCompletion({
        ...complete,
        "custom:username": "ab",
      })
    ).toBe(true);
    expect(
      needsFederatedProfileCompletion({
        ...complete,
        "custom:username": "",
      })
    ).toBe(true);
  });
});
