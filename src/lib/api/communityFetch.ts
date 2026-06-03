const RETRYABLE_STATUSES = new Set([500, 502, 503, 504]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface CommunityRetryOptions {
  retries?: number;
  baseDelayMs?: number;
}

/**
 * Fetch wrapper that transparently retries transient server/network failures.
 *
 * Amplify's managed Next.js SSR runtime occasionally returns a 5xx for an
 * otherwise-healthy request — the Next.js standalone server's internal IPC
 * drops the connection (`UND_ERR_SOCKET: other side closed` / `ECONNRESET`).
 * The community area fires several requests on load, so a single transient
 * blip would otherwise surface a confusing error. A short retry recovers
 * silently once the SSR worker is ready again.
 *
 * Only use this for idempotent (GET) requests.
 */
export const fetchCommunityWithRetry = async (
  input: RequestInfo | URL,
  init?: RequestInit,
  { retries = 2, baseDelayMs = 350 }: CommunityRetryOptions = {}
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
