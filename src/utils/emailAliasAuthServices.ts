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
import {
  buildRequiredSignUpAttributes,
  resolveCognitoUsername,
} from "@/utils/signUpAttributes";

const PENDING_SIGN_UP_USERNAME_KEY = "nurture_pending_sign_up_username";

const normalizeEmail = (value: string) => value.trim().toLowerCase();

/** Sign-in accepts username or email (pool also allows phone as alias). */
const normalizeSignInUsername = (value: string) => {
  const trimmed = value.trim();
  if (trimmed.includes("@")) return normalizeEmail(trimmed);
  return trimmed.toLowerCase();
};

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
 * Pool uses email/phone aliases — SignUp Username cannot be an email string.
 * We use the member's chosen username as Cognito Username; email stays in attributes.
 */
export const emailAliasAuthServices = {
  async handleSignUp(input: SignUpInput) {
    const email = resolveSignUpEmail(input);
    if (!email) {
      throw new Error("Email is required");
    }

    const rawAttributes = (input.options?.userAttributes ?? {}) as Record<
      string,
      string | undefined
    >;
    const username = resolveCognitoUsername(rawAttributes);
    rememberPendingUsername(username);

    const userAttributes = buildRequiredSignUpAttributes(email, rawAttributes);

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
      username: normalizeSignInUsername(input.username),
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
      username: normalizeSignInUsername(input.username),
    });
  },

  async handleForgotPasswordSubmit(input: ConfirmResetPasswordInput) {
    return confirmResetPassword({
      username: normalizeSignInUsername(input.username),
      confirmationCode: input.confirmationCode,
      newPassword: input.newPassword,
    });
  },
};
