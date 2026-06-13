import { describe, expect, it } from "vitest";
import {
  FEDERATED_PLACEHOLDER_ADDRESS,
  FEDERATED_PLACEHOLDER_PHONE,
  needsFederatedProfileCompletion,
} from "@/lib/auth/federatedProfile";

describe("needsFederatedProfileCompletion", () => {
  const complete = {
    phone_number: "+12065550100",
    address: "123 Main St, Ridgewood, NJ",
    "custom:username": "janedoe",
  };

  it("returns false when profile fields are complete", () => {
    expect(needsFederatedProfileCompletion(complete)).toBe(false);
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
        address: FEDERATED_PLACEHOLDER_ADDRESS,
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
