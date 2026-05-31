import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";

export type SessionUser = {
  userId: string;
  loginId?: string;
};

export const loadSessionUser = async (): Promise<SessionUser | null> => {
  try {
    const current = await getCurrentUser();
    const session = await fetchAuthSession();
    const email = session.tokens?.idToken?.payload?.email;
    const loginId =
      current.signInDetails?.loginId ??
      (typeof email === "string" ? email : undefined);

    return {
      userId: current.userId,
      loginId,
    };
  } catch {
    return null;
  }
};
