import { loadProfileAttributes } from "@/lib/auth/loadProfileAttributes";
import { needsFederatedProfileCompletion } from "@/lib/auth/federatedProfile";
import { resolveMemberHomePath } from "@/lib/intake/memberNavigation";

const buildCompleteProfilePath = (returnTo: string | null | undefined) => {
  const base = "/signup/complete-profile";
  if (returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")) {
    return `${base}?returnTo=${encodeURIComponent(returnTo)}`;
  }
  return base;
};

/** Safe in-app redirect target from auth query params. */
export const resolvePostAuthPath = async (
  returnTo: string | null | undefined
): Promise<string> => {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const attributes = await loadProfileAttributes();
      if (!needsFederatedProfileCompletion(attributes)) {
        if (returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")) {
          return returnTo;
        }
        return resolveMemberHomePath();
      }

      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        continue;
      }

      return buildCompleteProfilePath(returnTo);
    } catch {
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        continue;
      }
    }
  }

  if (returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return resolveMemberHomePath();
};
