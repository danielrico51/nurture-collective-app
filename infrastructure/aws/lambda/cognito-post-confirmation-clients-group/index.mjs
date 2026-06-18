import {
  AdminAddUserToGroupCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";

export const CLIENTS_COGNITO_GROUP = "clients";

export const SIGNUP_POST_CONFIRMATION_SOURCES = new Set([
  "PostConfirmation_ConfirmSignUp",
  "PostConfirmation_AdminConfirmSignUp",
]);

export const shouldAddToClientsGroup = (triggerSource) =>
  SIGNUP_POST_CONFIRMATION_SOURCES.has(triggerSource);

export const addUserToClientsGroup = async ({
  cognitoClient,
  userPoolId,
  username,
  groupName = CLIENTS_COGNITO_GROUP,
}) => {
  await cognitoClient.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: userPoolId,
      Username: username,
      GroupName: groupName,
    })
  );
};

export const handler = async (event) => {
  console.log("PostConfirmation:", event.triggerSource, event.userName);

  if (!shouldAddToClientsGroup(event.triggerSource)) {
    return event;
  }

  const groupName = process.env.CLIENTS_COGNITO_GROUP || CLIENTS_COGNITO_GROUP;
  const client = new CognitoIdentityProviderClient({ region: event.region });

  try {
    await addUserToClientsGroup({
      cognitoClient: client,
      userPoolId: event.userPoolId,
      username: event.userName,
      groupName,
    });
    console.log(`Added ${event.userName} to group ${groupName}`);
  } catch (error) {
    console.error("Failed to add user to clients group:", error);
    throw error;
  }

  return event;
};
