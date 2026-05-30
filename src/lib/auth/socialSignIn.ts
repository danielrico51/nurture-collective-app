import type { SocialAuthProvider } from "@/config/socialAuth";
import { storeAuthReturnTo } from "@/config/socialAuth";
import { signInWithRedirect } from "aws-amplify/auth";

export const signInWithSocialProvider = async (
  provider: SocialAuthProvider,
  returnTo?: string | null
): Promise<void> => {
  storeAuthReturnTo(returnTo ?? null);
  await signInWithRedirect({ provider });
};
