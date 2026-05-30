const STOP_KEYWORDS = new Set([
  "stop",
  "stopall",
  "unsubscribe",
  "cancel",
  "end",
  "quit",
]);

const START_KEYWORDS = new Set(["start", "unstop"]);

const HELP_KEYWORDS = new Set(["help", "info"]);

export type SmsKeywordAction = "stop" | "start" | "help" | null;

export const detectSmsKeywordAction = (body: string): SmsKeywordAction => {
  const normalized = body.trim().toLowerCase();
  if (!normalized) return null;
  if (STOP_KEYWORDS.has(normalized)) return "stop";
  if (START_KEYWORDS.has(normalized)) return "start";
  if (HELP_KEYWORDS.has(normalized)) return "help";
  return null;
};

export const SMS_STOP_REPLY =
  "You are unsubscribed from The Nesting Place SMS. No more messages will be sent. Reply START to resubscribe.";

export const SMS_START_REPLY =
  "Welcome back to The Nesting Place. Reply anytime for support coordination. Msg&data rates may apply. Reply STOP to opt out.";

export const SMS_HELP_REPLY =
  "The Nesting Place support concierge via SMS. Reply with your question or text STOP to opt out. Call (844) 926-2867 for urgent help.";
