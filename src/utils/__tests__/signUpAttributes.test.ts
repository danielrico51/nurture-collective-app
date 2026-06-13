import { describe, expect, it } from "vitest";
import {
  formatPhoneInputForAmplify,
  isFederatedPlaceholderPhone,
  isValidCognitoPhoneNumber,
  normalizePhoneNumber,
  splitPhoneForAmplifyForm,
} from "@/utils/signUpAttributes";

describe("splitPhoneForAmplifyForm", () => {
  it("splits US E.164 numbers for Amplify country_code + phone_number fields", () => {
    expect(splitPhoneForAmplifyForm("+12626139986")).toEqual({
      country_code: "+1",
      phone_number: "2626139986",
    });
  });

  it("normalizes ten-digit local numbers before splitting", () => {
    expect(splitPhoneForAmplifyForm("2626139986")).toEqual({
      country_code: "+1",
      phone_number: "2626139986",
    });
  });
});

describe("formatPhoneInputForAmplify", () => {
  it("strips a leading +1 country code from pasted values", () => {
    expect(formatPhoneInputForAmplify("+1 (262) 613-9986")).toBe("2626139986");
  });
});

describe("normalizePhoneNumber", () => {
  it("keeps valid E.164 numbers", () => {
    expect(normalizePhoneNumber("+12626139986")).toBe("+12626139986");
  });
});

describe("isValidCognitoPhoneNumber", () => {
  it("rejects invalid NANP area codes", () => {
    expect(isValidCognitoPhoneNumber("+10000000000")).toBe(false);
  });
});

describe("isFederatedPlaceholderPhone", () => {
  it("detects Google sub values mapped to phone_number", () => {
    expect(isFederatedPlaceholderPhone("1047293948273")).toBe(true);
  });
});
