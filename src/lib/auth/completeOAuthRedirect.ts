import { configureAmplify } from "@/utils/amplifyConfig";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Wait for Amplify to exchange the OAuth authorization code after redirect. */
export const waitForOAuthCallbackCompletion = async (
  maxWaitMs = 20000
): Promise<void> => {
  configureAmplify();

  const deadline = Date.now() + maxWaitMs;
  let lastError: unknown;

  while (Date.now() < deadline) {
    try {
      await fetchAuthSession();
      await getCurrentUser();
      return;
    } catch (error) {
      lastError = error;
      await sleep(300);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("OAuth sign-in timed out while completing redirect");
};
