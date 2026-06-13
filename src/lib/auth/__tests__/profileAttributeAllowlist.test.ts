import { describe, expect, it } from "vitest";
import { pickMutableProfileAttributes } from "@/lib/auth/profileAttributeAllowlist";

describe("pickMutableProfileAttributes", () => {
  it("keeps only mutable profile attributes", () => {
    expect(
      pickMutableProfileAttributes({
        given_name: "Alex",
        email: "alex@example.com",
        sub: "uuid",
        phone_number: "+12065550100",
      })
    ).toEqual({
      given_name: "Alex",
      phone_number: "+12065550100",
    });
  });
});
