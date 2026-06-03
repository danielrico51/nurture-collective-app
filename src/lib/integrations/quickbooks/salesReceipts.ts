import { serverQuickBooksConfig } from "@/config/quickbooks";
import { quickBooksPost } from "@/lib/integrations/quickbooks/client";
import type {
  QuickBooksInvoiceLine,
  QuickBooksRef,
} from "@/lib/integrations/quickbooks/types";

export interface QuickBooksCreateSalesReceiptInput {
  customerId: string;
  lineItems: Array<{
    amount: number;
    description: string;
    quantity?: number;
    unitPrice?: number;
    itemId?: string;
  }>;
  docNumber?: string;
  privateNote?: string;
  customerMemo?: string;
}

export interface QuickBooksSalesReceipt {
  Id: string;
  DocNumber?: string;
  TotalAmt?: number;
  CustomerRef?: QuickBooksRef;
}

const buildSalesReceiptLines = (
  input: QuickBooksCreateSalesReceiptInput
): QuickBooksInvoiceLine[] =>
  input.lineItems.map((item) => ({
    Amount: item.amount,
    DetailType: "SalesItemLineDetail" as const,
    Description: item.description,
    SalesItemLineDetail: {
      ItemRef: item.itemId
        ? { value: item.itemId }
        : serverQuickBooksConfig.defaultItemId
          ? { value: serverQuickBooksConfig.defaultItemId }
          : undefined,
      Qty: item.quantity ?? 1,
      UnitPrice: item.unitPrice ?? item.amount,
    },
  }));

export const createQuickBooksSalesReceipt = async (
  input: QuickBooksCreateSalesReceiptInput
): Promise<QuickBooksSalesReceipt> => {
  const response = await quickBooksPost<{ SalesReceipt: QuickBooksSalesReceipt }>(
    "/salesreceipt",
    {
      Line: buildSalesReceiptLines(input),
      CustomerRef: { value: input.customerId },
      DocNumber: input.docNumber,
      PrivateNote: input.privateNote,
      CustomerMemo: input.customerMemo
        ? { value: input.customerMemo }
        : undefined,
    }
  );
  return response.SalesReceipt;
};
