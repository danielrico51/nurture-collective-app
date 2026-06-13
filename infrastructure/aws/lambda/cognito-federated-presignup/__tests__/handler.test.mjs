import { describe, expect, it } from "vitest";
import { handler } from "../index.mjs";

describe("InboundFederation_ExternalProvider", () => {
  const baseEvent = {
    triggerSource: "InboundFederation_ExternalProvider",
    request: {
      providerType: "Google",
      attributes: {
        userInfo: {
          email: "danielrico51@gmail.com",
          given_name: "Daniel",
          family_name: "Rico",
        },
        idToken: {
          sub: "118280321789996478223",
          email: "danielrico51@gmail.com",
        },
      },
      userAttributes: {
        phone_number: "+12018928961",
        address: "215 Country Route 1",
        "custom:username": "rico1987",
        email: "danielrico51@gmail.com",
      },
    },
    response: {},
  };

  it("preserves saved phone and address on returning Google sign-in", async () => {
    const result = await handler(baseEvent);
    expect(result.response.userAttributesToMap.sub).toBe("118280321789996478223");
    expect(result.response.userAttributesToMap.phone_number).toBe("+12018928961");
    expect(result.response.userAttributesToMap.address).toBe("215 Country Route 1");
    expect(result.response.userAttributesToMap["custom:username"]).toBe("rico1987");
  });

  it("applies placeholders for brand-new federated users", async () => {
    const result = await handler({
      ...baseEvent,
      request: {
        ...baseEvent.request,
        userAttributes: {},
      },
    });

    expect(result.response.userAttributesToMap.phone_number).toBe("+12025550100");
    expect(result.response.userAttributesToMap.sub).toBe("118280321789996478223");
    expect(result.response.userAttributesToMap.address).toBe(
      "Pending profile completion"
    );
  });
});
