const RETRYABLE_STATUSES = new Set([500, 502, 503, 504]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface FetchWithRetryOptions {
  /** Extra attempts after the first (default 2 → 3 tries total). */
  retries?: number;
  baseDelayMs?: number;
}

/**
 * Fetch wrapper that transparently retries transient server/network failures.
 *
 * Amplify's managed Next.js SSR runtime occasionally returns a 5xx for an
 * otherwise-healthy request (cold start, IPC reset). Member apps fire several
 * requests on load; a short retry usually recovers once the worker is warm.
 *
 * Prefer this for idempotent GETs. POST/PUT may use it only when safe to repeat.
 */
export const fetchWithRetry = async (
  input: RequestInfo | URL,
  init?: RequestInit,
  { retries = 2, baseDelayMs = 400 }: FetchWithRetryOptions = {}
): Promise<Response> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(input, init);
      if (RETRYABLE_STATUSES.has(response.status) && attempt < retries) {
        await sleep(baseDelayMs * (attempt + 1));
        continue;
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await sleep(baseDelayMs * (attempt + 1));
        continue;
      }
      throw error;
    }
  }

  throw lastError;
};

/** @deprecated Use fetchWithRetry — kept for existing community imports. */
export const fetchCommunityWithRetry = fetchWithRetry;

export type CommunityRetryOptions = FetchWithRetryOptions;

export const isRetryableMemberLoadError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  if (message.includes("not authenticated") || message.includes("unauthorized")) {
    return false;
  }
  return (
    message.includes("server error (5") ||
    message.includes("request failed (5") ||
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("load failed") ||
    message.includes("econnreset") ||
    message.includes("socket")
  );
};

export interface RunWithAutoRetryOptions {
  /** Full re-runs after the first failure (default 1 → 2 tries total). */
  retries?: number;
  delayMs?: number;
}

/**
 * Re-runs a multi-fetch loader (e.g. Promise.all) when transient 5xx/network
 * errors slip through per-request retries — common on first Amplify cold start.
 */
export const runWithAutoRetry = async <T>(
  fn: () => Promise<T>,
  { retries = 1, delayMs = 800 }: RunWithAutoRetryOptions = {}
): Promise<T> => {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt >= retries || !isRetryableMemberLoadError(error)) {
        throw error;
      }
      await sleep(delayMs);
    }
  }
  throw lastError;
};
