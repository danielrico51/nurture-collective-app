import {
  getQuickBooksApiBaseUrl,
  serverQuickBooksConfig,
} from "@/config/quickbooks";
import { getValidQuickBooksTokens } from "@/lib/integrations/quickbooks/oauth";
import type { QuickBooksApiError } from "@/lib/integrations/quickbooks/types";

export class QuickBooksApiClientError extends Error {
  readonly status: number;
  readonly details?: string;

  constructor(message: string, status: number, details?: string) {
    super(message);
    this.name = "QuickBooksApiClientError";
    this.status = status;
    this.details = details;
  }
}

const parseErrorMessage = (payload: QuickBooksApiError): string => {
  const first = payload.Fault?.Error?.[0];
  return first?.Detail ?? first?.Message ?? "QuickBooks API request failed";
};

export const quickBooksRequest = async <T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown
): Promise<T> => {
  const tokens = await getValidQuickBooksTokens();
  const realmId = serverQuickBooksConfig.realmId || tokens.realmId;
  const url = `${getQuickBooksApiBaseUrl()}/v3/company/${realmId}${path}`;

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let payload: T & QuickBooksApiError;
  try {
    payload = JSON.parse(text) as T & QuickBooksApiError;
  } catch {
    throw new QuickBooksApiClientError(
      `QuickBooks returned non-JSON (${response.status})`,
      response.status,
      text.slice(0, 500)
    );
  }

  if (!response.ok) {
    throw new QuickBooksApiClientError(
      parseErrorMessage(payload),
      response.status,
      text.slice(0, 500)
    );
  }

  return payload;
};

export const quickBooksGet = async <T>(path: string): Promise<T> =>
  quickBooksRequest<T>("GET", path);

export const quickBooksPost = async <T>(path: string, body: unknown): Promise<T> =>
  quickBooksRequest<T>("POST", path, body);
