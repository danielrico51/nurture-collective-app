import { describe, expect, it, vi } from "vitest";
import {
  addUserToClientsGroup,
  CLIENTS_COGNITO_GROUP,
  shouldAddToClientsGroup,
} from "../index.mjs";

describe("shouldAddToClientsGroup", () => {
  it("returns true for sign-up confirmation sources", () => {
    expect(shouldAddToClientsGroup("PostConfirmation_ConfirmSignUp")).toBe(true);
    expect(shouldAddToClientsGroup("PostConfirmation_AdminConfirmSignUp")).toBe(
      true
    );
  });

  it("returns false for password-reset confirmation", () => {
    expect(
      shouldAddToClientsGroup("PostConfirmation_ConfirmForgotPassword")
    ).toBe(false);
  });
});

describe("addUserToClientsGroup", () => {
  it("calls AdminAddUserToGroup with pool username and clients group", async () => {
    const send = vi.fn().mockResolvedValue({});
    const cognitoClient = { send };

    await addUserToClientsGroup({
      cognitoClient,
      userPoolId: "us-east-1_example",
      username: "Google_118280321789996478223",
      groupName: CLIENTS_COGNITO_GROUP,
    });

    expect(send).toHaveBeenCalledOnce();
    const command = send.mock.calls[0][0];
    expect(command.input).toEqual({
      UserPoolId: "us-east-1_example",
      Username: "Google_118280321789996478223",
      GroupName: "clients",
    });
  });
});
