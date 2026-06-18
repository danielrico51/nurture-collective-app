import { afterEach, describe, expect, it } from "vitest";
import { resolveClientInvoicePublicOrigin } from "@/config/clientInvoices";

describe("resolveClientInvoicePublicOrigin", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it("uses configured public URL instead of localhost in emails", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://dev.d9588bqvrp5xs.amplifyapp.com";
    expect(
      resolveClientInvoicePublicOrigin("http://localhost:3000")
    ).toBe("https://dev.d9588bqvrp5xs.amplifyapp.com");
  });

  it("falls back to request origin when no public URL is configured", () => {
    expect(resolveClientInvoicePublicOrigin("http://localhost:3000")).toBe(
      "http://localhost:3000"
    );
  });

  it("uses deployed request origin on Amplify", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://www.nesting-place.com";
    expect(
      resolveClientInvoicePublicOrigin("https://dev.d9588bqvrp5xs.amplifyapp.com")
    ).toBe("https://dev.d9588bqvrp5xs.amplifyapp.com");
  });
});
