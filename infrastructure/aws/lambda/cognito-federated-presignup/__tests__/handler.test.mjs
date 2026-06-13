import { describe, expect, it } from "vitest";
import {
  buildNewFederatedUserAttributes,
  buildReturningFederatedUserAttributes,
  resolveInboundFederationAttributes,
} from "../index.mjs";

const baseEvent = {
  triggerSource: "InboundFederation_ExternalProvider",
  userName: "118280321789996478223",
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

const storedProfile = {
  email: "danielrico51@gmail.com",
  phone_number: "+12626139986",
  address: "215 Country Route 1",
  "custom:username": "rico1987",
  picture: "/api/account/avatar/example.jpg",
};

describe("resolveInboundFederationAttributes", () => {
  it("re-supplies saved phone and address for returning Google users", () => {
    const mapped = resolveInboundFederationAttributes(baseEvent, storedProfile);
    expect(mapped).not.toEqual({});
    expect(mapped.sub).toBe("118280321789996478223");
    expect(mapped.phone_number).toBe("+12626139986");
    expect(mapped.address).toBe("215 Country Route 1");
    expect(mapped["custom:username"]).toBe("rico1987");
  });

  it("applies placeholders for brand-new federated users", () => {
    const mapped = resolveInboundFederationAttributes(baseEvent, null);
    expect(mapped.phone_number).toBe("+12025550100");
    expect(mapped.sub).toBe("118280321789996478223");
    expect(mapped.address).toBe("Pending profile completion");
    expect(mapped.email).toBe("danielrico51@gmail.com");
  });
});

describe("buildReturningFederatedUserAttributes", () => {
  it("keeps stored picture when Google does not send one", () => {
    const mapped = buildReturningFederatedUserAttributes(baseEvent, storedProfile);
    expect(mapped.picture).toBe("/api/account/avatar/example.jpg");
  });
});

describe("buildNewFederatedUserAttributes", () => {
  it("includes Google sub for username mapping", () => {
    expect(buildNewFederatedUserAttributes(baseEvent).sub).toBe(
      "118280321789996478223"
    );
  });
});
