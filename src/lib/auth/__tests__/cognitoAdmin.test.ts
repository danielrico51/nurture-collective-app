import { describe, expect, it } from "vitest";
import { buildCognitoUserLookupFilters } from "@/lib/auth/cognitoAdmin";

describe("buildCognitoUserLookupFilters", () => {
  it("builds email and username filters for email sign-in", () => {
    expect(buildCognitoUserLookupFilters("Alex@Example.com")).toEqual([
      'email = "Alex@Example.com"',
      'username = "Alex@Example.com"',
    ]);
  });

  it("builds username filter for non-email sign-in", () => {
    expect(buildCognitoUserLookupFilters("janesmith")).toEqual([
      'username = "janesmith"',
    ]);
  });
});
