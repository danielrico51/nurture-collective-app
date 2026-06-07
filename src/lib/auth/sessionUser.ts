import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";

export type SessionUser = {
  userId: string;
  /** Value used at sign-in (username or email). */
  loginId?: string;
  /** Verified email from the ID token when available. */
  email?: string;
};

export const loadSessionUser = async (): Promise<SessionUser | null> => {
  try {
    const current = await getCurrentUser();
    const session = await fetchAuthSession();
    const payload = session.tokens?.idToken?.payload;
    const email =
      typeof payload?.email === "string" ? payload.email.trim() : undefined;
    const loginId =
      current.signInDetails?.loginId ??
      email ??
      (typeof payload?.["cognito:username"] === "string"
        ? payload["cognito:username"]
        : undefined);

    return {
      userId: current.userId,
      loginId,
      email,
    };
  } catch {
    return null;
  }
};
