/** User-facing copy for concierge stream / send failures. */
export const formatConversationStreamError = (
  raw: string,
  options?: { messageSaved?: boolean }
): string => {
  const lower = raw.toLowerCase();

  if (
    lower.includes("openai") ||
    lower.includes("429") ||
    lower.includes("503") ||
    lower.includes("timeout") ||
    lower.includes("overloaded")
  ) {
    return options?.messageSaved
      ? "Our assistant is briefly unavailable. Your message is saved — please tap Send again in a moment."
      : "Our assistant is briefly unavailable. Please wait a moment and try sending again.";
  }

  if (
    lower.includes("storage") ||
    lower.includes("s3") ||
    lower.includes("accessdenied") ||
    lower.includes("intake_s3")
  ) {
    return "We couldn't save your conversation just now. Please try again in a moment.";
  }

  if (lower.includes("finished") || lower.includes("complete")) {
    return raw;
  }

  if (lower.includes("not configured") || lower.includes("openai_api_key")) {
    return "The care coordinator is temporarily offline. Please try again shortly or use the contact form.";
  }

  if (options?.messageSaved) {
    return "We couldn't finish a reply to that message. Your message is saved — please tap Send again.";
  }

  return "Something went wrong while sending your message. Please try again.";
};
