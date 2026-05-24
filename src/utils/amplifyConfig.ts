import { Amplify } from "aws-amplify";
import { cognitoUserPoolsTokenProvider } from "aws-amplify/auth/cognito";
import { defaultStorage } from "aws-amplify/utils";

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

  Amplify.configure(
    {
      Auth: {
        Cognito: {
          userPoolId,
          userPoolClientId,
          signUpVerificationMethod: "code",
          loginWith: {
            email: true,
            phone: false,
            username: false,
          },
        },
      },
    },
    { ssr: true }
  );

  configured = true;
};

export const isAmplifyConfigured = () => configured;
