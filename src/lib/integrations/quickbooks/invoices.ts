import { serverQuickBooksConfig } from "@/config/quickbooks";
import { QBO_API_MINOR_VERSION } from "@/lib/integrations/quickbooks/constants";
import { quickBooksGet, quickBooksPost } from "@/lib/integrations/quickbooks/client";
import type {
  QuickBooksCreateInvoiceInput,
  QuickBooksInvoice,
  QuickBooksInvoiceLine,
} from "@/lib/integrations/quickbooks/types";

const escapeQueryValue = (value: string): string =>
  value.replace(/'/g, "\\'");

const buildInvoiceLines = (
  input: QuickBooksCreateInvoiceInput
): QuickBooksInvoiceLine[] =>
  input.lineItems.map((item) => {
    const itemId =
      item.itemId?.trim() || input.defaultItemId?.trim() || "";
    if (!itemId) {
      throw new Error(
        "QuickBooks service item is required for each invoice line"
      );
    }
    return {
      Amount: item.amount,
      DetailType: "SalesItemLineDetail",
      Description: item.description,
      SalesItemLineDetail: {
        ItemRef: { value: itemId },
        Qty: item.quantity ?? 1,
        UnitPrice: item.unitPrice ?? item.amount,
      },
    };
  });

export const createQuickBooksInvoice = async (
  input: QuickBooksCreateInvoiceInput
): Promise<QuickBooksInvoice> => {
  const response = await quickBooksPost<{ Invoice: QuickBooksInvoice }>(
    "/invoice",
    {
      Line: buildInvoiceLines({
        ...input,
        defaultItemId:
          input.defaultItemId ?? serverQuickBooksConfig.defaultItemId,
      }),
      CustomerRef: { value: input.customerId },
      DueDate: input.dueDate,
      DocNumber: input.docNumber,
      PrivateNote: input.privateNote,
      CustomerMemo: input.customerMemo
        ? { value: input.customerMemo }
        : undefined,
      BillEmail: input.billEmail
        ? { Address: input.billEmail }
        : undefined,
      AllowOnlineCreditCardPayment:
        input.allowOnlineCreditCardPayment ?? true,
      AllowOnlineACHPayment: input.allowOnlineAchPayment ?? true,
    }
  );
  return response.Invoice;
};

/** Customer-facing pay link (requires QBO Payments + include=invoiceLink). */
export const fetchQuickBooksInvoicePaymentLink = async (
  invoiceId: string
): Promise<string | null> => {
  const response = await quickBooksGet<{ Invoice: QuickBooksInvoice }>(
    `/invoice/${invoiceId}?minorversion=${QBO_API_MINOR_VERSION}&include=invoiceLink`
  );
  const link = response.Invoice?.InvoiceLink?.trim();
  return link || null;
};

export const resolveQuickBooksInvoicePaymentLink = async (
  invoiceId: string
): Promise<string | null> => {
  try {
    return await fetchQuickBooksInvoicePaymentLink(invoiceId);
  } catch {
    return null;
  }
};

export const getQuickBooksInvoice = async (
  invoiceId: string
): Promise<QuickBooksInvoice> => {
  const response = await quickBooksGet<{ Invoice: QuickBooksInvoice }>(
    `/invoice/${invoiceId}`
  );
  return response.Invoice;
};

/** Service line item Ids on a QBO invoice (excludes subtotals/discounts). */
export const readQuickBooksInvoiceServiceItemIds = (
  invoice: QuickBooksInvoice
): string[] =>
  (invoice.Line ?? [])
    .filter((line) => line.DetailType === "SalesItemLineDetail")
    .map((line) => line.SalesItemLineDetail?.ItemRef?.value?.trim())
    .filter((id): id is string => Boolean(id));

export const quickBooksInvoiceUsesServiceItemId = (
  invoice: QuickBooksInvoice,
  itemId: string
): boolean => {
  const lineItemIds = readQuickBooksInvoiceServiceItemIds(invoice);
  if (lineItemIds.length === 0) return false;
  return lineItemIds.every((id) => id === itemId);
};

export const findQuickBooksInvoiceByDocNumber = async (
  docNumber: string
): Promise<QuickBooksInvoice | null> => {
  const trimmed = docNumber.trim();
  if (!trimmed) return null;

  const query = `select * from Invoice where DocNumber = '${escapeQueryValue(trimmed)}'`;
  const response = await quickBooksGet<{
    QueryResponse?: { Invoice?: QuickBooksInvoice[] };
  }>(`/query?query=${encodeURIComponent(query)}`);

  const invoices = response.QueryResponse?.Invoice ?? [];
  return invoices[0] ?? null;
};

export const sendQuickBooksInvoice = async (
  invoiceId: string,
  email?: string
): Promise<void> => {
  await quickBooksPost(`/invoice/${invoiceId}/send`, email ? { Email: email } : {});
};

export const voidQuickBooksInvoice = async (
  invoice: QuickBooksInvoice
): Promise<void> => {
  if (!invoice.Id || invoice.SyncToken == null) {
    throw new Error("QuickBooks invoice Id and SyncToken are required to void");
  }
  await quickBooksPost("/invoice?operation=void", {
    Id: invoice.Id,
    SyncToken: invoice.SyncToken,
  });
};
