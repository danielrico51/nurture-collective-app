import { describe, expect, it } from "vitest";
import {
  buildNewFederatedUserAttributes,
  resolveInboundFederationAttributes,
} from "../index.mjs";

const baseEvent = {
  triggerSource: "InboundFederation_ExternalProvider",
  userName: "google_118280321789996478223",
  request: {
    providerName: "Google",
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
  },
  response: {},
};

describe("resolveInboundFederationAttributes", () => {
  it("no-ops for returning users so Cognito keeps saved phone and address", () => {
    expect(
      resolveInboundFederationAttributes(baseEvent, {
        email: "danielrico51@gmail.com",
        phone_number: "+12018928961",
        address: "215 Country Route 1",
        "custom:username": "rico1987",
      })
    ).toEqual({});
  });

  it("applies placeholders for brand-new federated users", () => {
    const mapped = resolveInboundFederationAttributes(baseEvent, null);
    expect(mapped.phone_number).toBe("+12025550100");
    expect(mapped.sub).toBe("118280321789996478223");
    expect(mapped.address).toBe("Pending profile completion");
    expect(mapped.email).toBe("danielrico51@gmail.com");
  });
});

describe("buildNewFederatedUserAttributes", () => {
  it("includes Google sub for username mapping", () => {
    expect(buildNewFederatedUserAttributes(baseEvent).sub).toBe(
      "118280321789996478223"
    );
  });
});
