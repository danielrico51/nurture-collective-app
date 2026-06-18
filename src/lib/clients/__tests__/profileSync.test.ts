import { describe, expect, it } from "vitest";
import { validateUpdateClientInput } from "@/lib/clients/profileSync";
import { ClientUpdateValidationError } from "@/lib/clients/profileSync";

describe("validateUpdateClientInput", () => {
  it("accepts valid profile updates", () => {
    const result = validateUpdateClientInput({
      name: "Jeanmarie Grembowski",
      email: "jean@example.com",
      phone: "2626139986",
      locationZip: "53072",
      tags: ["doula"],
      notesSummary: "Updated summary",
    });
    expect(result.name).toBe("Jeanmarie Grembowski");
    expect(result.email).toBe("jean@example.com");
    expect(result.phone).toMatch(/^\+1/);
  });

  it("rejects empty name", () => {
    expect(() => validateUpdateClientInput({ name: "  " })).toThrow(
      ClientUpdateValidationError
    );
  });

  it("rejects invalid email", () => {
    expect(() => validateUpdateClientInput({ email: "not-an-email" })).toThrow(
      ClientUpdateValidationError
    );
  });
});
