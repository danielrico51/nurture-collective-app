import {
  QuickBooksApiClientError,
  quickBooksGet,
  quickBooksPost,
} from "@/lib/integrations/quickbooks/client";
import type {
  QuickBooksCreateCustomerInput,
  QuickBooksCustomer,
} from "@/lib/integrations/quickbooks/types";

const escapeQueryValue = (value: string): string =>
  value.replace(/'/g, "\\'");

const MAX_DISPLAY_NAME_LENGTH = 500;

export const readQuickBooksCustomerEmail = (
  customer: QuickBooksCustomer
): string => customer.PrimaryEmailAddr?.Address?.trim().toLowerCase() ?? "";

export const findQuickBooksCustomerByEmail = async (
  email: string
): Promise<QuickBooksCustomer | null> => {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return null;

  const query = `select * from Customer where PrimaryEmailAddr = '${escapeQueryValue(trimmed)}'`;
  const response = await quickBooksGet<{
    QueryResponse?: { Customer?: QuickBooksCustomer[] };
  }>(`/query?query=${encodeURIComponent(query)}`);

  const customers = response.QueryResponse?.Customer ?? [];
  return customers[0] ?? null;
};

export const findQuickBooksCustomerByDisplayName = async (
  displayName: string
): Promise<QuickBooksCustomer | null> => {
  const trimmed = displayName.trim();
  if (!trimmed) return null;

  const query = `select * from Customer where DisplayName = '${escapeQueryValue(trimmed)}'`;
  const response = await quickBooksGet<{
    QueryResponse?: { Customer?: QuickBooksCustomer[] };
  }>(`/query?query=${encodeURIComponent(query)}`);

  const customers = response.QueryResponse?.Customer ?? [];
  return customers[0] ?? null;
};

export const buildUniqueQuickBooksDisplayName = (
  displayName: string,
  email: string
): string => {
  const base = displayName.trim() || email.split("@")[0]?.trim() || "Customer";
  const suffix = email.trim().toLowerCase();
  return `${base} (${suffix})`.slice(0, MAX_DISPLAY_NAME_LENGTH);
};

export const isQuickBooksDuplicateNameError = (error: unknown): boolean => {
  if (!(error instanceof QuickBooksApiClientError)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("name supplied already exists") ||
    message.includes("duplicate name")
  );
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

const customerMatchesEmail = (
  customer: QuickBooksCustomer,
  email: string
): boolean => {
  const existingEmail = readQuickBooksCustomerEmail(customer);
  return !existingEmail || existingEmail === email;
};

export const ensureQuickBooksCustomer = async (
  input: QuickBooksCreateCustomerInput
): Promise<QuickBooksCustomer> => {
  const email = input.email.trim().toLowerCase();
  const displayName =
    input.displayName.trim() || email.split("@")[0]?.trim() || "Customer";

  const byEmail = await findQuickBooksCustomerByEmail(email);
  if (byEmail) return byEmail;

  const byName = await findQuickBooksCustomerByDisplayName(displayName);
  if (byName && customerMatchesEmail(byName, email)) {
    return byName;
  }

  const displayNameToCreate =
    byName && !customerMatchesEmail(byName, email)
      ? buildUniqueQuickBooksDisplayName(displayName, email)
      : displayName;

  const byResolvedName =
    await findQuickBooksCustomerByDisplayName(displayNameToCreate);
  if (byResolvedName) return byResolvedName;

  try {
    return await createQuickBooksCustomer({
      ...input,
      displayName: displayNameToCreate,
      email,
    });
  } catch (error) {
    if (!isQuickBooksDuplicateNameError(error)) {
      throw error;
    }

    const existingAfterError =
      await findQuickBooksCustomerByDisplayName(displayNameToCreate);
    if (existingAfterError && customerMatchesEmail(existingAfterError, email)) {
      return existingAfterError;
    }

    const fallbackName = buildUniqueQuickBooksDisplayName(displayName, email);
    if (fallbackName === displayNameToCreate) {
      throw error;
    }

    const byFallbackName =
      await findQuickBooksCustomerByDisplayName(fallbackName);
    if (byFallbackName) return byFallbackName;

    return createQuickBooksCustomer({
      ...input,
      displayName: fallbackName,
      email,
    });
  }
};
