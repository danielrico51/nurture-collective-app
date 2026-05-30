import { defineAuth, secret } from "@aws-amplify/backend";

const oauthCallbackUrls = [
  "http://localhost:3000/oauth/callback",
  "https://dev.d9588bqvrp5xs.amplifyapp.com/oauth/callback",
  "https://main.d9588bqvrp5xs.amplifyapp.com/oauth/callback",
];

const oauthLogoutUrls = [
  "http://localhost:3000/",
  "https://dev.d9588bqvrp5xs.amplifyapp.com/",
  "https://main.d9588bqvrp5xs.amplifyapp.com/",
];

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailSubject: "Welcome to The Nesting Place",
      verificationEmailBody: (code) => `Your verification code is: ${code()}`,
      verificationEmailStyle: "CODE",
    },
    externalProviders: {
      google: {
        clientId: secret("GOOGLE_CLIENT_ID"),
        clientSecret: secret("GOOGLE_CLIENT_SECRET"),
      },
      facebook: {
        clientId: secret("FACEBOOK_CLIENT_ID"),
        clientSecret: secret("FACEBOOK_CLIENT_SECRET"),
      },
      signInWithApple: {
        clientId: secret("SIWA_CLIENT_ID"),
        keyId: secret("SIWA_KEY_ID"),
        privateKey: secret("SIWA_PRIVATE_KEY"),
        teamId: secret("SIWA_TEAM_ID"),
      },
      callbackUrls: oauthCallbackUrls,
      logoutUrls: oauthLogoutUrls,
    },
  },
  userAttributes: {
    email: {
      required: true,
      mutable: true,
    },
    givenName: {
      required: false,
      mutable: true,
    },
    familyName: {
      required: false,
      mutable: true,
    },
  },
});
