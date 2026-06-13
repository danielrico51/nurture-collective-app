import {
  getAppBaseUrl,
  getCognitoOAuthDomain,
  getEnabledSocialProviders,
  getOAuthCallbackUrl,
  getOAuthSignOutUrl,
} from "@/config/socialAuth";
import { Amplify } from "aws-amplify";
import { signInWithRedirect } from "aws-amplify/auth";
import { cognitoUserPoolsTokenProvider } from "aws-amplify/auth/cognito";
import { defaultStorage } from "aws-amplify/utils";

// Registers Amplify's OAuth redirect listener (completeOAuthFlow on /oauth/callback).
void signInWithRedirect;

let configured = false;

export const configureAmplify = () => {
  if (configured) return;

  const userPoolId = process.env.NEXT_PUBLIC_USER_POOL_ID;
  const userPoolClientId = process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID;
  const region = process.env.NEXT_PUBLIC_AWS_REGION;

  if (!userPoolId || !userPoolClientId || !region) {
    if (typeof window !== "undefined") {
      console.warn(
        "Amplify: missing NEXT_PUBLIC_USER_POOL_ID, NEXT_PUBLIC_USER_POOL_CLIENT_ID, or NEXT_PUBLIC_AWS_REGION"
      );
    }
    return;
  }

  cognitoUserPoolsTokenProvider.setKeyValueStorage(defaultStorage);

  const oauthDomain = getCognitoOAuthDomain();
  const socialProviders = getEnabledSocialProviders();
  const appBaseUrl = getAppBaseUrl();
  const callbackUrl = getOAuthCallbackUrl();
  const callbackUrls = Array.from(
    new Set([
      callbackUrl,
      callbackUrl.replace("://www.", "://"),
      callbackUrl.replace("://", "://www."),
    ])
  );

  const loginWith: {
    email: boolean;
    phone: boolean;
    username: boolean;
    oauth?: {
      domain: string;
      scopes: string[];
      redirectSignIn: string[];
      redirectSignOut: string[];
      responseType: "code";
      providers: ("Google" | "Facebook" | "Apple")[];
    };
  } = {
    email: true,
    phone: false,
    username: false,
  };

  if (oauthDomain && socialProviders.length > 0) {
    loginWith.oauth = {
      domain: oauthDomain,
      scopes: [
        "openid",
        "email",
        "profile",
        "aws.cognito.signin.user.admin",
      ],
      redirectSignIn: callbackUrls,
      redirectSignOut: [getOAuthSignOutUrl()],
      responseType: "code",
      providers: socialProviders,
    };
  }

  Amplify.configure(
    {
      Auth: {
        Cognito: {
          userPoolId,
          userPoolClientId,
          signUpVerificationMethod: "code",
          loginWith,
        },
      },
    },
    { ssr: true }
  );

  configured = true;
};

if (typeof window !== "undefined") {
  configureAmplify();
}

export const isAmplifyConfigured = () => configured;
