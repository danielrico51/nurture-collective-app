import { resolveMemberHomePath } from "@/lib/intake/memberNavigation";

/** Safe in-app redirect target from auth query params. */
export const resolvePostAuthPath = async (
  returnTo: string | null | undefined
): Promise<string> => {
  if (returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return resolveMemberHomePath();
};
