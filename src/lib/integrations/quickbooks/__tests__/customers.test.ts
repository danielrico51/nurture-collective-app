import { afterEach, describe, expect, it, vi } from "vitest";
import { QuickBooksApiClientError } from "@/lib/integrations/quickbooks/client";

const { quickBooksGet, quickBooksPost } = vi.hoisted(() => ({
  quickBooksGet: vi.fn(),
  quickBooksPost: vi.fn(),
}));

vi.mock("@/lib/integrations/quickbooks/client", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/integrations/quickbooks/client")
  >("@/lib/integrations/quickbooks/client");
  return {
    ...actual,
    quickBooksGet,
    quickBooksPost,
  };
});

import {
  buildUniqueQuickBooksDisplayName,
  ensureQuickBooksCustomer,
  isQuickBooksDuplicateNameError,
} from "@/lib/integrations/quickbooks/customers";

describe("QuickBooks customer helpers", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("builds a unique display name from email", () => {
    expect(buildUniqueQuickBooksDisplayName("Jane Doe", "jane@example.com")).toBe(
      "Jane Doe (jane@example.com)"
    );
  });

  it("detects duplicate-name API errors", () => {
    expect(
      isQuickBooksDuplicateNameError(
        new QuickBooksApiClientError("The name supplied already exists.", 400)
      )
    ).toBe(true);
    expect(
      isQuickBooksDuplicateNameError(
        new QuickBooksApiClientError("Something else failed", 400)
      )
    ).toBe(false);
  });

  it("reuses an existing customer matched by display name when email is compatible", async () => {
    quickBooksGet
      .mockResolvedValueOnce({ QueryResponse: { Customer: [] } })
      .mockResolvedValueOnce({
        QueryResponse: {
          Customer: [
            {
              Id: "42",
              DisplayName: "Jane Doe",
              PrimaryEmailAddr: { Address: "jane@example.com" },
            },
          ],
        },
      });

    const customer = await ensureQuickBooksCustomer({
      displayName: "Jane Doe",
      email: "jane@example.com",
    });

    expect(customer.Id).toBe("42");
    expect(quickBooksPost).not.toHaveBeenCalled();
  });

  it("creates a unique customer when the display name belongs to another email", async () => {
    quickBooksGet
      .mockResolvedValueOnce({ QueryResponse: { Customer: [] } })
      .mockResolvedValueOnce({
        QueryResponse: {
          Customer: [
            {
              Id: "42",
              DisplayName: "Jane Doe",
              PrimaryEmailAddr: { Address: "other@example.com" },
            },
          ],
        },
      })
      .mockResolvedValueOnce({ QueryResponse: { Customer: [] } });

    quickBooksPost.mockResolvedValueOnce({
      Customer: {
        Id: "99",
        DisplayName: "Jane Doe (jane@example.com)",
        PrimaryEmailAddr: { Address: "jane@example.com" },
      },
    });

    const customer = await ensureQuickBooksCustomer({
      displayName: "Jane Doe",
      email: "jane@example.com",
    });

    expect(customer.Id).toBe("99");
    expect(quickBooksPost).toHaveBeenCalledWith("/customer", {
      DisplayName: "Jane Doe (jane@example.com)",
      GivenName: undefined,
      FamilyName: undefined,
      PrimaryEmailAddr: { Address: "jane@example.com" },
    });
  });

  it("retries with a unique display name after a duplicate-name create failure", async () => {
    quickBooksGet
      .mockResolvedValueOnce({ QueryResponse: { Customer: [] } })
      .mockResolvedValueOnce({ QueryResponse: { Customer: [] } })
      .mockResolvedValueOnce({ QueryResponse: { Customer: [] } })
      .mockResolvedValueOnce({ QueryResponse: { Customer: [] } })
      .mockResolvedValueOnce({ QueryResponse: { Customer: [] } });

    quickBooksPost
      .mockRejectedValueOnce(
        new QuickBooksApiClientError("The name supplied already exists.", 400)
      )
      .mockResolvedValueOnce({
        Customer: {
          Id: "100",
          DisplayName: "Jane Doe (jane@example.com)",
          PrimaryEmailAddr: { Address: "jane@example.com" },
        },
      });

    const customer = await ensureQuickBooksCustomer({
      displayName: "Jane Doe",
      email: "jane@example.com",
    });

    expect(customer.Id).toBe("100");
    expect(quickBooksPost).toHaveBeenCalledTimes(2);
  });
});
