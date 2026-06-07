import { describe, expect, it } from "vitest";
import {
  formatPhoneInputForAmplify,
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
