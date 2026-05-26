/** True only when the user explicitly asks to finish intake — not on casual phrasing. */
export const userWantsToCompleteIntake = (message: string): boolean => {
  const trimmed = message.trim();
  if (!trimmed) return false;

  const explicitPatterns = [
    /^that's everything/i,
    /complete my (care profile|intake)/i,
    /^please (complete|submit|finish)/i,
    /^(submit|finish) my intake/i,
    /finalize my (care profile|intake)/i,
    /wrap up my intake/i,
  ];

  return explicitPatterns.some((pattern) => pattern.test(trimmed));
};
