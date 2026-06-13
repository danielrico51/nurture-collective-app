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
  try {
    const attributes = await loadProfileAttributes();
    if (needsFederatedProfileCompletion(attributes)) {
      return buildCompleteProfilePath(returnTo);
    }
  } catch {
    /* not signed in or attributes unavailable */
  }

  if (returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return resolveMemberHomePath();
};
