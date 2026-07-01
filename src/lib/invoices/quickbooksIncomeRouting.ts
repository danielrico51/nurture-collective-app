import "server-only";

import { readQuickBooksCategoryItemId } from "@/config/quickbooks";
import {
  classifyServiceInvoiceIncomeCategory,
  resolveExpectationQuickBooksIncomeCategory,
} from "@/lib/invoices/quickbooksIncomeCategories";
import type {
  ClientService,
  QuickBooksIncomeCategory,
  ServiceInvoice,
} from "@/types/clientService";
import type { EngagementServiceType } from "@/types/serviceEngagement";

export type { QuickBooksIncomeCategory };

export {
  classifyServiceInvoiceIncomeCategory,
  resolveExpectationQuickBooksIncomeCategory,
};

export const resolveQuickBooksItemIdForCategory = (
  category: QuickBooksIncomeCategory
): string => readQuickBooksCategoryItemId(category);

export const resolveServiceInvoiceIncomeCategory = (input: {
  invoice: Pick<ServiceInvoice, "description" | "quickbooksIncomeCategory">;
  service: Pick<ClientService, "title">;
  engagementServiceType?: EngagementServiceType | null;
}): QuickBooksIncomeCategory =>
  input.invoice.quickbooksIncomeCategory ??
  classifyServiceInvoiceIncomeCategory(input);

export const resolveServiceInvoiceQuickBooksItemId = (input: {
  invoice: Pick<ServiceInvoice, "description" | "quickbooksIncomeCategory">;
  service: Pick<ClientService, "title">;
  engagementServiceType?: EngagementServiceType | null;
}): string => {
  const category = resolveServiceInvoiceIncomeCategory(input);
  return resolveQuickBooksItemIdForCategory(category);
};
