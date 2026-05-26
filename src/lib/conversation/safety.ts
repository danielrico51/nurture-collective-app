const SAFETY_PATTERNS = [
  /\b(suicid|kill myself|end my life|self.?harm|hurt myself)\b/i,
  /\b(medical emergency|can'?t breathe|severe bleeding|stroke|heart attack)\b/i,
  /\b(want to die|don'?t want to live)\b/i,
];

export const detectSafetyEscalation = (text: string): boolean =>
  SAFETY_PATTERNS.some((pattern) => pattern.test(text));

export const SAFETY_ESCALATION_REPLY =
  "Thank you for sharing something so important. What you're describing sounds like it needs immediate support from a healthcare professional or emergency services. If you're in crisis, please call 988 (Suicide & Crisis Lifeline) or 911. We're here for care navigation, but your safety comes first.";
