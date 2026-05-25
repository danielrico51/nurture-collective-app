import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  MemberProfile: a
    .model({
      userId: a.string().required(),
      dueDate: a.date(),
      notes: a.string(),
      phone: a.string(),
      preferredContact: a.string(),
      intakeStatus: a.string(),
      clickUpClientId: a.string(),
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});
