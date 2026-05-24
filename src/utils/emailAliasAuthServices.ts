import {
  confirmResetPassword,
  confirmSignUp,
  resendSignUpCode,
  resetPassword,
  signIn,
  signUp,
  type ConfirmResetPasswordInput,
  type ConfirmSignUpInput,
  type ResendSignUpCodeInput,
  type ResetPasswordInput,
  type SignInInput,
  type SignUpInput,
} from "aws-amplify/auth";
import { buildRequiredSignUpAttributes } from "@/utils/signUpAttributes";

const PENDING_SIGN_UP_USERNAME_KEY = "nurture_pending_sign_up_username";

const createInternalUsername = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
};

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const resolveSignUpEmail = (input: SignUpInput) => {
  const fromAttributes = input.options?.userAttributes?.email;
  if (typeof fromAttributes === "string" && fromAttributes.trim()) {
    return normalizeEmail(fromAttributes);
  }
  if (typeof input.username === "string" && input.username.includes("@")) {
    return normalizeEmail(input.username);
  }
  return null;
};

const rememberPendingUsername = (username: string) => {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(PENDING_SIGN_UP_USERNAME_KEY, username);
  }
};

const getPendingUsername = (fallback: string) => {
  if (typeof window === "undefined") return fallback;
  return sessionStorage.getItem(PENDING_SIGN_UP_USERNAME_KEY) ?? fallback;
};

const clearPendingUsername = () => {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(PENDING_SIGN_UP_USERNAME_KEY);
  }
};

/**
 * Cognito pools with email alias cannot use an email string as SignUp Username.
 * Users still sign in with email; sign-up uses an internal username + email attribute.
 */
export const emailAliasAuthServices = {
  async handleSignUp(input: SignUpInput) {
    const email = resolveSignUpEmail(input);
    if (!email) {
      throw new Error("Email is required");
    }

    const username = createInternalUsername();
    rememberPendingUsername(username);

    const userAttributes = buildRequiredSignUpAttributes(
      email,
      (input.options?.userAttributes ?? {}) as Record<string, string | undefined>
    );

    return signUp({
      username,
      password: input.password,
      options: {
        ...input.options,
        userAttributes,
      },
    });
  },

  async handleSignIn(input: SignInInput) {
    if (!input.password) {
      throw new Error("Password is required");
    }
    return signIn({
      username: normalizeEmail(input.username),
      password: input.password,
    });
  },

  async handleConfirmSignUp(input: ConfirmSignUpInput) {
    const username = getPendingUsername(input.username);
    const result = await confirmSignUp({
      username,
      confirmationCode: input.confirmationCode,
    });
    clearPendingUsername();
    return result;
  },

  async handleResendSignUpCode(input: ResendSignUpCodeInput) {
    return resendSignUpCode({
      username: getPendingUsername(input.username),
    });
  },

  async handleForgotPassword(input: ResetPasswordInput) {
    return resetPassword({
      username: normalizeEmail(input.username),
    });
  },

  async handleForgotPasswordSubmit(input: ConfirmResetPasswordInput) {
    return confirmResetPassword({
      username: normalizeEmail(input.username),
      confirmationCode: input.confirmationCode,
      newPassword: input.newPassword,
    });
  },
};
