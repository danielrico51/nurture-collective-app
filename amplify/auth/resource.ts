import { defineAuth } from "@aws-amplify/backend";

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailSubject: "Welcome to The Nurture Collective",
      verificationEmailBody: (code) => `Your verification code is: ${code()}`,
      verificationEmailStyle: "CODE",
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
