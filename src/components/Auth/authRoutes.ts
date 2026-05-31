export const AMPLIFY_SIGN_UP_ROUTES = new Set(["signUp", "confirmSignUp"]);

export const AMPLIFY_SIGN_IN_ROUTES = new Set([
  "signIn",
  "resetPassword",
  "confirmResetPassword",
  "forceNewPassword",
]);

export const isAmplifySignUpRoute = (route: string): boolean =>
  AMPLIFY_SIGN_UP_ROUTES.has(route);

export const isAmplifySignInRoute = (route: string): boolean =>
  AMPLIFY_SIGN_IN_ROUTES.has(route);

/** URL paths for auth screens (avoid loose substring matches on /apps/...). */
export const isAuthSignUpPath = (pathname: string): boolean =>
  pathname === "/signup" ||
  pathname.startsWith("/signup/") ||
  pathname.endsWith("/signup");

export const isAuthSignInPath = (pathname: string): boolean =>
  pathname === "/signin" || pathname.startsWith("/signin/");
