/** Workspace user who owns the intro-call calendar — not the public info@ alias. */
export const CALENDAR_OWNER_EMAIL = "admin@nesting-place.com";

export const INVALID_CALENDAR_DELEGATED_EMAILS = new Set([
  "info@nesting-place.com",
]);

export type CalendarDelegationEnv = {
  calendarDelegatedUser?: string;
  tasksDelegatedUser?: string;
};

export type AdcCredentials = {
  type?: string;
  refresh_token?: string;
  client_id?: string;
  client_email?: string;
  private_key?: string;
};

export type GoogleAuthFailureKind =
  | "expired_adc"
  | "workspace_delegation"
  | "unknown";

export const resolveCalendarDelegatedUser = (
  env: CalendarDelegationEnv = {
    calendarDelegatedUser: process.env.GOOGLE_CALENDAR_DELEGATED_USER,
    tasksDelegatedUser: process.env.GOOGLE_TASKS_DELEGATED_USER,
  }
): string => {
  const configured =
    env.calendarDelegatedUser?.trim() ||
    env.tasksDelegatedUser?.trim() ||
    CALENDAR_OWNER_EMAIL;

  if (INVALID_CALENDAR_DELEGATED_EMAILS.has(configured.toLowerCase())) {
    return CALENDAR_OWNER_EMAIL;
  }

  return configured;
};

export const validateCalendarDelegatedUserForDeploy = (
  email: string
): { ok: true; email: string } | { ok: false; reason: string } => {
  const trimmed = email.trim();
  if (!trimmed) {
    return {
      ok: false,
      reason: `GOOGLE_CALENDAR_DELEGATED_USER is required (use ${CALENDAR_OWNER_EMAIL}).`,
    };
  }

  if (INVALID_CALENDAR_DELEGATED_EMAILS.has(trimmed.toLowerCase())) {
    return {
      ok: false,
      reason:
        `${trimmed} is a public alias and cannot be used for Calendar delegation. ` +
        `Use ${CALENDAR_OWNER_EMAIL} — the intro-call calendar owner.`,
    };
  }

  return { ok: true, email: trimmed };
};

export const parseAdcJson = (raw: string): AdcCredentials => {
  const parsed = JSON.parse(raw) as AdcCredentials;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("ADC JSON must be an object");
  }
  return parsed;
};

/** Validates ADC before copying it to Amplify (delegated auth uses this to signJwt). */
export const validateAdcJsonForDelegatedDeploy = (
  raw: string
): { ok: true; adcJson: string; credentialType: string } | { ok: false; reason: string } => {
  let parsed: AdcCredentials;
  try {
    parsed = parseAdcJson(raw);
  } catch {
    return { ok: false, reason: "ADC file is not valid JSON." };
  }

  const type = parsed.type?.trim();
  if (!type) {
    return { ok: false, reason: 'ADC JSON is missing a "type" field.' };
  }

  if (type === "authorized_user") {
    if (!parsed.refresh_token?.trim()) {
      return {
        ok: false,
        reason:
          "ADC authorized_user credentials are missing refresh_token. Run: gcloud auth application-default login",
      };
    }
    if (!parsed.client_id?.trim()) {
      return { ok: false, reason: "ADC authorized_user credentials are missing client_id." };
    }
    return { ok: true, adcJson: raw.trim(), credentialType: type };
  }

  if (type === "service_account") {
    if (!parsed.client_email?.trim() || !parsed.private_key?.trim()) {
      return {
        ok: false,
        reason: "ADC service_account credentials are missing client_email or private_key.",
      };
    }
    return { ok: true, adcJson: raw.trim(), credentialType: type };
  }

  return {
    ok: false,
    reason: `Unsupported ADC type "${type}". Expected authorized_user or service_account.`,
  };
};

export const classifyGoogleAuthFailure = (
  message: string
): { kind: GoogleAuthFailureKind; hint: string } => {
  const lower = message.toLowerCase();

  if (
    lower.includes("invalid_rapt") ||
    lower.includes("invalid_grant") ||
    lower.includes("token has been expired or revoked")
  ) {
    return {
      kind: "expired_adc",
      hint:
        "Google application-default credentials expired. On your machine run: gcloud auth application-default login, " +
        "then npm run verify:calendar-deploy, then npm run amplify:concierge-scheduling, then redeploy Amplify.",
    };
  }

  if (
    lower.includes("unauthorized_client") ||
    lower.includes("unauthorized to retrieve access tokens") ||
    lower.includes("not authorized for any of the scopes") ||
    lower.includes("domain-wide delegation")
  ) {
    return {
      kind: "workspace_delegation",
      hint:
        `In Google Workspace Admin, authorize domain-wide delegation for nurture-tasks-sync ` +
        `with scopes https://www.googleapis.com/auth/calendar and https://www.googleapis.com/auth/tasks. ` +
        `Delegated user must be ${CALENDAR_OWNER_EMAIL}.`,
    };
  }

  return {
    kind: "unknown",
    hint:
      "Check GOOGLE_CALENDAR_DELEGATED_USER, ADC JSON on Amplify, and Workspace domain-wide delegation.",
  };
};

export const buildSchedulingAuthErrorMessage = (
  delegatedUser: string,
  failureMessage: string
): string => {
  const classified = classifyGoogleAuthFailure(failureMessage);
  if (classified.kind === "expired_adc") {
    return (
      `Google Calendar credentials on the server are expired or need re-auth for ${delegatedUser}. ` +
      classified.hint
    );
  }

  return (
    `Google Calendar access is not authorized for ${delegatedUser}. ` +
    `Use GOOGLE_CALENDAR_DELEGATED_USER=${CALENDAR_OWNER_EMAIL} (not info@). ` +
    classified.hint
  );
};
