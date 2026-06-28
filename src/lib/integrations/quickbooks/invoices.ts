import { serverQuickBooksConfig } from "@/config/quickbooks";
import { QBO_API_MINOR_VERSION } from "@/lib/integrations/quickbooks/constants";
import { quickBooksGet, quickBooksPost } from "@/lib/integrations/quickbooks/client";
import type {
  QuickBooksCreateCustomerInput,
  QuickBooksCreateInvoiceInput,
  QuickBooksCustomer,
  QuickBooksInvoice,
  QuickBooksInvoiceLine,
} from "@/lib/integrations/quickbooks/types";

const escapeQueryValue = (value: string): string =>
  value.replace(/'/g, "\\'");

export const findQuickBooksCustomerByEmail = async (
  email: string
): Promise<QuickBooksCustomer | null> => {
  const query = `select * from Customer where PrimaryEmailAddr = '${escapeQueryValue(email)}'`;
  const response = await quickBooksGet<{
    QueryResponse?: { Customer?: QuickBooksCustomer[] };
  }>(`/query?query=${encodeURIComponent(query)}`);

  const customers = response.QueryResponse?.Customer ?? [];
  return customers[0] ?? null;
};

export const createQuickBooksCustomer = async (
  input: QuickBooksCreateCustomerInput
): Promise<QuickBooksCustomer> => {
  const response = await quickBooksPost<{ Customer: QuickBooksCustomer }>(
    "/customer",
    {
      DisplayName: input.displayName,
      GivenName: input.givenName,
      FamilyName: input.familyName,
      PrimaryEmailAddr: { Address: input.email },
    }
  );
  return response.Customer;
};

export const ensureQuickBooksCustomer = async (
  input: QuickBooksCreateCustomerInput
): Promise<QuickBooksCustomer> => {
  const existing = await findQuickBooksCustomerByEmail(input.email);
  if (existing) return existing;
  return createQuickBooksCustomer(input);
};

const buildInvoiceLines = (
  input: QuickBooksCreateInvoiceInput
): QuickBooksInvoiceLine[] =>
  input.lineItems.map((item) => ({
    Amount: item.amount,
    DetailType: "SalesItemLineDetail",
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

export const createQuickBooksInvoice = async (
  input: QuickBooksCreateInvoiceInput
): Promise<QuickBooksInvoice> => {
  const response = await quickBooksPost<{ Invoice: QuickBooksInvoice }>(
    "/invoice",
    {
      Line: buildInvoiceLines(input),
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
