import { createDelegatedGoogleAuthClient } from "@/lib/integrations/google/delegatedAuth";
import {
  CALENDAR_OWNER_EMAIL,
  classifyGoogleAuthFailure,
  validateAdcJsonForDelegatedDeploy,
  validateCalendarDelegatedUserForDeploy,
} from "@/lib/scheduling/calendarDeployGuards";

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";

export type VerifyCalendarDelegationInput = {
  delegatedUser: string;
  serviceAccount: string;
  adcJson: string;
};

export type VerifyCalendarDelegationResult =
  | { ok: true; delegatedUser: string; credentialType: string }
  | { ok: false; stage: "config" | "adc" | "delegation"; error: string; hint: string };

export const verifyCalendarDelegation = async (
  input: VerifyCalendarDelegationInput
): Promise<VerifyCalendarDelegationResult> => {
  const userCheck = validateCalendarDelegatedUserForDeploy(input.delegatedUser);
  if (!userCheck.ok) {
    return {
      ok: false,
      stage: "config",
      error: userCheck.reason,
      hint: `Set GOOGLE_CALENDAR_DELEGATED_USER=${CALENDAR_OWNER_EMAIL}.`,
    };
  }

  const adcCheck = validateAdcJsonForDelegatedDeploy(input.adcJson);
  if (!adcCheck.ok) {
    return {
      ok: false,
      stage: "adc",
      error: adcCheck.reason,
      hint: "Run: gcloud auth application-default login",
    };
  }

  try {
    const client = await createDelegatedGoogleAuthClient({
      scope: CALENDAR_SCOPE,
      subject: userCheck.email,
      serviceAccount: input.serviceAccount.trim(),
      adcJson: adcCheck.adcJson,
    });

    if (!client.credentials.access_token) {
      return {
        ok: false,
        stage: "delegation",
        error: "No Calendar access token returned.",
        hint: classifyGoogleAuthFailure("no access token").hint,
      };
    }

    return {
      ok: true,
      delegatedUser: userCheck.email,
      credentialType: adcCheck.credentialType,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const classified = classifyGoogleAuthFailure(message);
    return {
      ok: false,
      stage: classified.kind === "expired_adc" ? "adc" : "delegation",
      error: message,
      hint: classified.hint,
    };
  }
};
