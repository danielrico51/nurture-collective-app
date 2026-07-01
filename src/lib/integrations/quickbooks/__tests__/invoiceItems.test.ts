import { describe, expect, it } from "vitest";
import type { QuickBooksInvoice } from "@/lib/integrations/quickbooks/types";
import {
  quickBooksInvoiceUsesServiceItemId,
  readQuickBooksInvoiceServiceItemIds,
} from "@/lib/integrations/quickbooks/invoices";

const invoiceWithItems = (itemIds: string[]): QuickBooksInvoice => ({
  Id: "90",
  SyncToken: "0",
  Line: itemIds.map((itemId, index) => ({
    Amount: 20,
    DetailType: "SalesItemLineDetail",
    Description: index === 0 ? "Deposit" : "Fee",
    SalesItemLineDetail: {
      ItemRef: { value: itemId, name: `Item ${itemId}` },
      Qty: 1,
      UnitPrice: 20,
    },
  })),
});

describe("readQuickBooksInvoiceServiceItemIds", () => {
  it("reads service line item ids", () => {
    expect(readQuickBooksInvoiceServiceItemIds(invoiceWithItems(["11"]))).toEqual([
      "11",
    ]);
  });

  it("detects when all lines use the expected item", () => {
    expect(quickBooksInvoiceUsesServiceItemId(invoiceWithItems(["11"]), "11")).toBe(
      true
    );
    expect(quickBooksInvoiceUsesServiceItemId(invoiceWithItems(["1"]), "11")).toBe(
      false
    );
  });
});
