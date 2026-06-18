import { describe, expect, it } from "vitest";
import {
  buildManualClientRecord,
  ClientValidationError,
  validateCreateClientInput,
} from "@/lib/clients/manualClient";

describe("validateCreateClientInput", () => {
  it("accepts a valid payload", () => {
    const result = validateCreateClientInput({
      name: "Jane Doe",
      email: "jane@example.com",
      channel: "referral",
      tags: ["vip", " postpartum "],
    });
    expect(result.name).toBe("Jane Doe");
    expect(result.channel).toBe("referral");
    expect(result.tags).toEqual(["vip", "postpartum"]);
  });

  it("requires a name", () => {
    expect(() =>
      validateCreateClientInput({ email: "a@b.com", channel: "phone" })
    ).toThrow(ClientValidationError);
  });

  it("requires phone or email", () => {
    expect(() =>
      validateCreateClientInput({ name: "No Contact", channel: "phone" })
    ).toThrow(/Phone or email/);
  });

  it("rejects an invalid channel", () => {
    expect(() =>
      validateCreateClientInput({
        name: "Jane",
        email: "jane@example.com",
        channel: "carrier-pigeon",
      })
    ).toThrow(/channel/);
  });
});

describe("buildManualClientRecord", () => {
  it("builds a prospect client with manual source", () => {
    const record = buildManualClientRecord({
      clientId: "client-1",
      payload: {
        name: "Jane",
        email: "jane@example.com",
        phone: "+15551234567",
        channel: "referral",
        tags: ["vip"],
        leadId: null,
        cognitoSub: null,
        locationZip: "07030",
      },
    });
    expect(record.clientId).toBe("client-1");
    expect(record.status).toBe("prospect");
    expect(record.source).toBe("manual_referral");
    expect(record.billing.lifetimeValueCents).toBe(0);
    expect(record.coordinatorId).toBe("");
  });
});
