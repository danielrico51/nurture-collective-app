import { serverQuickBooksConfig } from "@/config/quickbooks";
import type {
  ClientService,
  QuickBooksIncomeCategory,
  ServiceInvoice,
} from "@/types/clientService";
import type { EngagementServiceType } from "@/types/serviceEngagement";

export type { QuickBooksIncomeCategory };

const DEPOSIT_DESCRIPTION = /^deposit$/i;

const OTHER_OPERATION_TITLE =
  /\b(massage|class|cpr|workshop|lactation consult|gift card|egift|event|training|course)\b/i;

const BIRTH_SERVICE_TITLE =
  /\b(birth doula|birth support|labor support|birth services?)\b/i;

const POSTPARTUM_SERVICE_TITLE =
  /\b(postpartum|overnight|newborn care|night doula|day doula)\b/i;

export const classifyServiceInvoiceIncomeCategory = (input: {
  invoice: Pick<ServiceInvoice, "description">;
  service: Pick<ClientService, "title">;
  engagementServiceType?: EngagementServiceType | null;
}): QuickBooksIncomeCategory => {
  const description = input.invoice.description.trim();
  const title = input.service.title.trim();

  if (DEPOSIT_DESCRIPTION.test(description)) {
    return "deposit";
  }

  const engagementType = input.engagementServiceType ?? null;
  if (engagementType === "birth") return "birth_services";
  if (engagementType === "postpartum") return "postpartum_support";
  if (engagementType === "other") return "other_operation_income";

  if (OTHER_OPERATION_TITLE.test(title) || OTHER_OPERATION_TITLE.test(description)) {
    return "other_operation_income";
  }
  if (BIRTH_SERVICE_TITLE.test(title) || BIRTH_SERVICE_TITLE.test(description)) {
    return "birth_services";
  }
  if (POSTPARTUM_SERVICE_TITLE.test(title) || POSTPARTUM_SERVICE_TITLE.test(description)) {
    return "postpartum_support";
  }

  return "postpartum_support";
};

export const resolveExpectationQuickBooksIncomeCategory = (input: {
  kind: "deposit" | "balance";
  engagementServiceType: EngagementServiceType;
}): QuickBooksIncomeCategory => {
  if (input.kind === "deposit") return "deposit";
  if (input.engagementServiceType === "birth") return "birth_services";
  if (input.engagementServiceType === "other") return "other_operation_income";
  return "postpartum_support";
};

export const resolveQuickBooksItemIdForCategory = (
  category: QuickBooksIncomeCategory
): string => {
  const { itemIds, defaultItemId } = serverQuickBooksConfig;
  const categoryItemId = itemIds[category];
  return categoryItemId || defaultItemId || "";
};

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
