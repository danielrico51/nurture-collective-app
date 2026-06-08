/** True when a chip would not send useful intake data if tapped as-is. */
export const isAmbiguousQuickReply = (reply: string): boolean => {
  const trimmed = reply.trim();
  if (!trimmed || trimmed.length < 2) return true;

  if (/[\[\]{}]|\.{3}|_{2,}/.test(trimmed)) return true;
  if (/prefer not|rather not|don't want to share|do not want to share/i.test(trimmed)) {
    return true;
  }
  if (/skip(\s+the)?\s+(zip|location|name|email)/i.test(trimmed)) return true;
  if (/^my name is\s*$/i.test(trimmed)) return true;
  if (/^my name is\s+\[?name\]?\s*$/i.test(trimmed)) return true;
  if (/^name is\s/i.test(trimmed)) return true;
  if (/your (name|email|zip|phone)/i.test(trimmed)) return true;
  if (/e\.g\.|for example|placeholder|enter your|type your/i.test(trimmed)) {
    return true;
  }

  return false;
};

export const sanitizeQuickReplies = (
  replies: string[],
  max = 4
): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const reply of replies) {
    const trimmed = reply.trim();
    if (!trimmed || isAmbiguousQuickReply(trimmed)) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
    if (result.length >= max) break;
  }

  return result;
};
