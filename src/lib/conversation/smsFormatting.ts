const SMS_MAX_LENGTH = 1500;

/** Strip markdown and trim for SMS delivery. */
export const formatAssistantReplyForSms = (text: string): string => {
  const plain = text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (plain.length <= SMS_MAX_LENGTH) return plain;

  return `${plain.slice(0, SMS_MAX_LENGTH - 3).trim()}...`;
};
