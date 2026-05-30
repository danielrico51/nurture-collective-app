import { describe, expect, it } from "vitest";
import {
  mapContactFormToIntakeSubmit,
  resolveServiceRequested,
  splitFullName,
} from "@/lib/intake/mapContactForm";
import {
  enrichPayload,
  normalizePayload,
  normalizePhone,
  validatePayload,
} from "@/lib/intake/submitService";

describe("splitFullName", () => {
  it("splits first and last name", () => {
    expect(splitFullName("Alex Burleigh")).toEqual({
      first_name: "Alex",
      last_name: "Burleigh",
    });
  });
});

describe("resolveServiceRequested", () => {
  it("maps mom service slug to label", () => {
    expect(
      resolveServiceRequested({ audience: "mom", serviceSlug: "postpartum" })
    ).toBeTruthy();
  });
});

describe("mapContactFormToIntakeSubmit", () => {
  it("maps contact form values to intake payload", () => {
    const payload = mapContactFormToIntakeSubmit({
      audience: "mom",
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "2015550100",
      message: "Need postpartum support",
      preferredContact: "email",
      serviceSlug: "postpartum",
    });

    expect(payload.first_name).toBe("Jane");
    expect(payload.last_name).toBe("Doe");
    expect(payload.email).toBe("jane@example.com");
    expect(payload.service_requested).toBeTruthy();
    expect(payload.source).toBe("website");
  });
});

describe("validatePayload", () => {
  it("requires first_name, service_requested, and phone or email", () => {
    expect(() => validatePayload({})).toThrow();
    expect(
      validatePayload({
        first_name: "Jane",
        email: "jane@example.com",
        service_requested: "Postpartum support",
      })
    ).toMatchObject({
      first_name: "Jane",
      service_requested: "Postpartum support",
    });
  });
});

describe("normalizePayload", () => {
  it("normalizes phone and email", () => {
    const normalized = normalizePayload(
      validatePayload({
        first_name: " Jane ",
        email: "Jane@Example.com",
        phone: "2015550100",
        service_requested: " Doula ",
      })
    );

    expect(normalized.first_name).toBe("Jane");
    expect(normalized.email).toBe("jane@example.com");
    expect(normalized.phone).toBe("+12015550100");
    expect(normalized.service_requested).toBe("Doula");
  });
});

describe("normalizePhone", () => {
  it("formats US numbers", () => {
    expect(normalizePhone("201-555-0100")).toBe("+12015550100");
  });
});

describe("enrichPayload", () => {
  it("adds lead metadata", () => {
    const enriched = enrichPayload({
      first_name: "Jane",
      service_requested: "Doula",
      email: "jane@example.com",
      source: "website",
    });

    expect(enriched.lead_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
    expect(enriched.status).toBe("new");
    expect(enriched.version).toBe(1);
    expect(enriched.lead_source).toBe("website");
  });
});
